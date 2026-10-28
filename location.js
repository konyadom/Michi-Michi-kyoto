export const NEIGHBORHOOD_ZOOM=16;
export function initialView(saved,walks,fallback){
  if(saved&&Array.isArray(saved.center)&&saved.center.length===2&&saved.center.every(Number.isFinite)&&
    saved.center[0]>=20&&saved.center[0]<=46&&saved.center[1]>=122&&saved.center[1]<=154){
    return {center:saved.center,zoom:NEIGHBORHOOD_ZOOM};
  }
  const p=walks?.at(-1)?.points?.at(-1);
  return {center:p?p.slice(0,2):fallback,zoom:NEIGHBORHOOD_ZOOM};
}
// The callback is ignored after the visitor chooses another place or starts a recording.
export function locateOnce({geolocation,onPosition,onError,shouldCenter=()=>true}){
  if(!geolocation){onError('unsupported');return;}
  geolocation.getCurrentPosition(position=>{
    const {latitude,longitude,accuracy}=position.coords;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)){onError('unavailable');return;}
    onPosition({point:[latitude,longitude],accuracy,center:shouldCenter()});
  },error=>onError(error.code===1?'denied':error.code===3?'timeout':'unavailable'),
  {enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}
