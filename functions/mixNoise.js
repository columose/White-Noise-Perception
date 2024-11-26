import { fCreateNoiseSample } from "./CreateNoise.js";

// This function combines two noise files around the segmented time of interest.
// Importantly, the new noise is not repeated

export function fMixNoise(ctx,noise,repeats,startIdx,endIdx){
    
    // create an empty buffer that is repeats times longer than noise
    const chans = noise.numberOfChannels;
    const sampleRate = noise.sampleRate
    const length = noise.length * repeats;
    let buffer = ctx.createBuffer(chans, length, sampleRate) 
    let bufferData = buffer.getChannelData(0); 

    // repeating noise data is constant
    const noiseData = noise.getChannelData(0);

    // Fill buffer with new and repeated noise
    let bufferIdx = 0; // create variable to index buffer samples
    for (let iRep = 0; iRep < repeats; iRep++){

        // Create new noise in each iteration so this noise pattern cannot be detected as a repeat
        let newData = fCreateNoiseSample(ctx, noise.duration).getChannelData(0);

        // Fill new buffer with a mix of repeated and non-repeated noise
        for (let iSamp = 0; iSamp < noise.length; iSamp++){
            if (iSamp < startIdx || iSamp > endIdx){
                bufferData[iSamp + bufferIdx] = newData[iSamp]; 
            } 
            else{
                bufferData[iSamp + bufferIdx] = noiseData[iSamp];
            }
        }
        // change buffer index for loop number 2 to log repeat
        bufferIdx += noise.length;
    }
    return buffer;
}
