import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
const source=await readFile(new URL('../lib/sync-protocol.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {flatten,expand,changes,applyChanges}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const uid='00000000-0000-4000-8000-000000000001', other='00000000-0000-4000-8000-000000000002';
const device='10000000-0000-4000-8000-000000000001', device2='10000000-0000-4000-8000-000000000002';

test('IDs estáveis preservam edições simultâneas, exclusão e listas vazias',()=>{
  const base={habits:[{id:'a',title:'Ler'},{id:'b',title:'Treinar'}],focusMinutesByDay:{'2026-09-01':25}};
  const left={...base,habits:[{id:'b',title:'Academia'},{id:'a',title:'Ler'}]};
  const right={...base,habits:[{id:'a',title:'Ler 30 min'},{id:'b',title:'Treinar'}]};
  const merged=expand(applyChanges(applyChanges(flatten(base),changes(flatten(base),flatten(left))),changes(flatten(base),flatten(right))));
  assert.deepEqual(merged.habits.map(h=>h.title),['Academia','Ler 30 min']);
  const deleted=expand(applyChanges(flatten(base),changes(flatten(base),flatten({...base,habits:[]}))));
  assert.equal(deleted.habits?.length || 0,0);
});

test('contadores somam mudanças independentes; passos cumulativos não duplicam',()=>{
  const base=flatten({focusMinutesByDay:{'2026-09-01':25},stepsByDay:{'2026-09-01':100}});
  const update=changes(base,flatten({focusMinutesByDay:{'2026-09-01':50},stepsByDay:{'2026-09-01':150}}));
  const result=expand(applyChanges(applyChanges(base,update),update));
  assert.equal(result.focusMinutesByDay['2026-09-01'],75);
  assert.equal(result.stepsByDay['2026-09-01'],150);
});

test('Postgres: RLS, idempotência, concorrência, totais anuais e rollback',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key); insert into auth.users values ('${uid}'),('${other}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
    const sql=await readFile(new URL('../supabase/migrations/20260913020430_mercury_cloud_sync.sql',import.meta.url),'utf8');
    await db.exec(sql);
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${uid}';`);
    const apply=async(seq,ops,d=device)=>(await db.query('select public.mercury_apply($1::uuid,$2::bigint,$3::jsonb) as row',[d,seq,JSON.stringify(ops)])).rows[0].row;
    const first={waterEntriesByDay:{'2025-12-31':[{id:'water-1',amountMl:250,recordedAt:'2025-12-31T20:00:00Z'}]},focusMinutesByDay:{'2026-01-01':25},stepsByDay:{'2026-01-01':100},completions:{'2026-01-01':{h:true}},workoutCaloriesByDay:{'2026-01-01':80}};
    const operations=changes({},flatten(first));
    const one=await apply(1,operations);
    const retry=await apply(1,operations);
    assert.deepEqual(retry,one);
    await assert.rejects(apply(3,operations),/Sequence gap/);
    const delta=changes(flatten(first),flatten({...first,focusMinutesByDay:{'2026-01-01':50}}));
    await Promise.all([apply(2,delta),apply(1,delta,device2)]);
    let annual=(await db.query('select * from public.mercury_annual order by year')).rows;
    assert.equal(Number(annual[0].water_ml),250);
    assert.equal(Number(annual[1].focus_minutes),75);
    const corrected={...first,waterEntriesByDay:{'2025-12-31':[]},completions:{'2026-01-01':{h:false}}};
    await apply(3,changes(flatten(first),flatten(corrected)));
    annual=(await db.query('select * from public.mercury_annual order by year')).rows;
    assert.equal(Number(annual[0].water_ml),0);assert.equal(Number(annual[1].habits),0);
    const before=(await db.query('select document,revision from public.mercury_documents')).rows;
    await assert.rejects(apply(4,[{key:JSON.stringify(['stepsByDay','2026-01-01']),mode:'max',value:500},{key:'[]',mode:'invalid'}]));
    assert.deepEqual((await db.query('select document,revision from public.mercury_documents')).rows,before);
    const workout=changes({},flatten({workoutDone:{'2026-01-01':{w1:true}},workoutCaloriesByCompletion:{'2026-01-01':{w1:120}}}));
    await apply(4,workout); await apply(2,workout,device2);
    const total=(await db.query('select workout_kcal,workouts from public.mercury_annual where year=2026')).rows[0];
    assert.equal(Number(total.workout_kcal),200); // 80 legacy + 120, even across two devices.
    assert.equal(Number(total.workouts),1);
    await db.exec(`set request.jwt.claim.sub='${other}';`);
    assert.equal((await db.query('select * from public.mercury_documents')).rows.length,0);
    assert.equal((await db.query('select * from public.mercury_annual')).rows.length,0);
    await assert.rejects(db.query('insert into public.mercury_documents(user_id) values($1)',[uid]),/row-level security/);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select public.mercury_apply($1::uuid,1,\'[]\'::jsonb)',[device]),/permission denied/);
  } finally {await db.close();}
});

 test('treinos distintos concluídos simultaneamente mantêm as duas marcações',()=>{
   const left=flatten({workoutDone:{'2026-09-01':{a:true}},workoutCompletionsByDay:{'2026-09-01':['a']}});
   const right=flatten({workoutDone:{'2026-09-01':{b:true}},workoutCompletionsByDay:{'2026-09-01':['b']}});
   const result=expand(applyChanges(left,changes({},right)));
   assert.deepEqual(result.workoutCompletionsByDay['2026-09-01'],['a','b']);
 });
