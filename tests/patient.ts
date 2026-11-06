/** A fresh QA patient for this run. The names are plain strings for exact field fills. */
export function patientIdentity(service: 'esa' | 'psd' | 'placard') {
  const now = new Date();
  const clock = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join('');
  if (service === 'placard') {
    return {
      firstName: `QAAvdesai${clock}`,
      lastName: `Placard${clock}`,
      email: `ansh05testing+${service}-${clock}@gmail.com`,
    };
  }

  const stamp = now.toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const last = service === 'esa' ? 'Esa' : 'Psd';
  return {
    firstName: `QA${clock}`,
    lastName: `${last}${clock}`,
    email: `avdesai+${service}-regression-${stamp}@enacton.email`,
  };
}
