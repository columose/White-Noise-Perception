//Apply hanning window to noise with fade in and out

export function fHannWin(buffer){
    const N = Math.floor(buffer.length*0.1); //number samples in fade window
    const nIdxs = [N, buffer.length-N]
    let winData = buffer.getChannelData(0)

    for (let iSamp = 0; iSamp < buffer.length; iSamp++){
        if(iSamp < nIdxs[0]){
            winData[iSamp]*= 0.5*(1- Math.cos((Math.PI*iSamp)/(N-1)));//switch to 2 * Math.Pi as well
        }
        else if (iSamp > nIdxs[1]){
            let fadeOutIndex = buffer.length - iSamp;
            winData[iSamp] *= 0.5*(1-Math.cos((Math.PI*fadeOutIndex)/(N-1)));
        }
        else{
            winData[iSamp] = winData[iSamp]
        }
    }
 return buffer
}
