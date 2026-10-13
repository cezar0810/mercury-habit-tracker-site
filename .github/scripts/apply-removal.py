import hashlib
from pathlib import Path
p=Path("components/mercury/web-app.tsx")
L=p.read_text().splitlines(keepends=True)
def C(n,t): assert L[n-1].rstrip("\n")==t, f"linha {n}: {L[n-1]!r}"
C(31,'import { AccountControl } from "./account-control";')
C(35,'} from "./supabase-auth";')
C(61,'import { CloudCheck } from "./sync-status";')
C(63,'import { AuthSplash, LoginGate } from "./login-gate";')
C(69,'export function MercuryWebApp() {')
C(78,'  const { user, loading: authLoading } = useMercuryAuth();')
C(118,'  // Sincronização com o Supabase (pull inicial, push com debounce e')
C(120,'  const syncState = useMercurySync(data, (next) => setData({ ...next }));')
C(338,'  if (!hydrated || authLoading) {')
C(349,'  // Portão de login: o acesso ao app exige conta Google (mesma do app Flutter).')
C(353,'')
C(354,'  let screen = (')
C(447,'            <AccountControl currentName={data.name} />')
C(547,'          <CloudCheck syncState={syncState} />')
assert len(L)==728, len(L)
del L[546:547]
del L[446:447]
del L[348:353]
L[337]='  if (!hydrated) {\n'
del L[117:121]
L[68:78]=['export function MercuryWebApp() {\n','  return <MercuryWebAppInner />;\n','}\n','\n','function MercuryWebAppInner() {\n']
del L[60:63]
del L[30:35]
s=''.join(L)
d=s.encode()
h=hashlib.sha1(b"blob %d\0"%len(d)+d).hexdigest()
assert h=="9024128f8a0ed6a067034c6a9019f476ac7fac0a", h
p.write_text(s)
print("ok",h)
