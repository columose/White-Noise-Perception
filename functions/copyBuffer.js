// Copies original buffer 
// Advantage - you can manipulate the copy of the buffer without affecting the original.

export function fCopyBuffer (AudioContext,buffer){
    const bufferCopy = AudioContext.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
    const originalData = buffer.getChannelData(0)
    let copyData = bufferCopy.getChannelData(0);
    for (let iSamp = 0; iSamp < buffer.length; iSamp++){
        copyData[iSamp] = originalData[iSamp];
    }
    return bufferCopy;
}