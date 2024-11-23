// This function takes Web audio API context and duration in ms variables to return a white noise buffer

// Note that populating the audio buffer with for loops is rather tedious, but methods (concat, fill etc) didn't work on the immutable object

// Useful background reading at: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#audio_buffers_frames_samples_and_channels
// And : https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#demo

export function fCreateNoiseSample(ctx,duration){

    //Define dimensions of audio buffer
    let Chans = 1; 
    let sampleRate = 44100;
    let length = sampleRate*duration; 

    let buffer = ctx.createBuffer(Chans, length, sampleRate) // creates a buffer filled with zeros
    let data = buffer.getChannelData(0); //start at index 0, then loop through each point

    const min = -1; //for math.random
    const max = 1;
    
    // Fill first second of buffer data with white noise && fade-in/out
    for (let iSamp = 0; iSamp < sampleRate; iSamp++){
        data[iSamp] = Math.random() * (max-min) + min; // This was original noise
    }
    return buffer;
}

    /*
    // This appears to be redundant due to source loop method
    if (duration > 1){ 
        // create copy containing the white noise samples
        let temp = data.subarray(0,sampleRate)

        // Repeat white noise accross data array
        let startInd = sampleRate;
        for (let iRep = 0; iRep < duration - 1; iRep++){
            for (let iSamp = 0; iSamp < temp.length; iSamp++){
                data[iSamp + startInd] = temp[iSamp];
            }
            //console.log(data.slice(startInd,startInd + 10))
            startInd+=sampleRate
        }
    }
        */

