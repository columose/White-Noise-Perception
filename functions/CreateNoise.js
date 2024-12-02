// This function takes Web audio API context and duration in ms variables to return a white noise buffer

// Note that populating the audio buffer with for loops is rather tedious, but methods (concat, fill etc) didn't work on the immutable object

// Useful background reading at: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#audio_buffers_frames_samples_and_channels
// And : https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#demo

export function fCreateNoiseSample(ctx,duration){

    //Define dimensions of audio buffer
    let chans = 1; 
    let sampleRate = 44100;
    let length = sampleRate*duration; 

    let buffer = ctx.createBuffer(chans, length, sampleRate) // creates a buffer filled with zeros
    let data = buffer.getChannelData(0); //start at index 0

    const min = -1; //for math.random
    const max = 1;
    
    // loop through each data point
    for (let iSamp = 0; iSamp < sampleRate; iSamp++){
        data[iSamp] = Math.random() * (max-min) + min; 
    }
    return buffer;
}


