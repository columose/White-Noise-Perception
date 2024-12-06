//Useful link to understand pipeline for filters
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#the_noise_%E2%80%94_random_noise_buffer_with_a_biquad_filter

//Create filter
export function fcreateBPFilter (ctx,low, high,qScaleFact){
    const filter = ctx.createBiquadFilter()

    //Define filter and cutoffs
    const BW = high-low;
    const centreFreq = (low + high)/2;
    filter.type = 'bandpass'
    filter.frequency.value = centreFreq;
    let Q = centreFreq/BW;
    filter.Q.value = Q*qScaleFact;
    return filter;
}