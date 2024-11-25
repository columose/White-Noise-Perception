//Useful link to understand pipeline for filters
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#the_noise_%E2%80%94_random_noise_buffer_with_a_biquad_filter

//Create filter
export function fcreateBPFilter (ctx,low, high){
    const filter = ctx.createBiquadFilter()

    //Define filter and cutoffs
    filter.type = 'bandpass'
    const lower = low;
    const higher = high;
    const centreFreq = Math.sqrt(lower * higher)
    const BW = higher - lower;
    const Q = centreFreq/BW;
    filter.frequency.value = centreFreq;
    filter.Q.value = Q;
    return filter;
}