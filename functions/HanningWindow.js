// Fills samples before segment with zeros
// Additionally, applies fade-in/out to samples that are 10% less than and greater than the segment window
export function fHannWin(buffer, startIdx,endIdx){
    let winData = buffer.getChannelData(0);
    const length = endIdx - startIdx; //Because we're only interested in the selected segment
    const fadeWindow = Math.floor(length/10);
    const fadeIdxs = [Math.max(0,startIdx-fadeWindow),Math.min(buffer.length,endIdx+fadeWindow)] // ensure that fade indices exist in noise buffer

    for (let iSamp = 0; iSamp < buffer.length; iSamp++){
        if (iSamp < fadeIdxs[0] || iSamp > fadeIdxs[1]){
            winData[iSamp] = 0; //fill samples before and after fade indices with zeros
        } 
        else if (iSamp > fadeIdxs[0] && iSamp < startIdx){
            let hannFactor = 0.5 * (1- Math.cos((2*Math.PI*iSamp)/(fadeWindow-1)));
            winData[iSamp] *= hannFactor;
        }
        else if (iSamp > endIdx && iSamp < fadeIdxs[1]){
            const fadeOutIndex = iSamp - endIdx; // Relative position in fade-out window
            let hannFactor = 0.5 * (1 - Math.cos((2 * Math.PI * fadeOutIndex) / (fadeWindow - 1)));
            winData[iSamp] *= hannFactor;
        }
    }
    const newLen = winData.filter(element => element !== 0).length;
    return [buffer,fadeIdxs,newLen];
}