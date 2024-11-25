// This function combines two noise files around the segmented time of interest

export function fMixNoise(noise,maskNoise,startIdx,endIdx){
    let noiseData = noise.getChannelData(0);
    let maskData = maskNoise.getChannelData(0);

    for (let iSamp = 0; iSamp < ArrayBuffer.length; iSamp++){
        if (iSamp < startIdx || iSamp > endIdx){
            noiseData[iSamp] = maskData[iSamp]
        }
    }
    return noise
}