// Import functions
import { fCreateNoiseSample } from "./functions/CreateNoise.js";
import { fcreateBPFilter } from "./functions/BPFilter.js";
import { fCopyBuffer } from "./functions/copyBuffer.js";
import { fMixNoise } from "./functions/mixNoise.js";

// Declare global variables
const ctxAudio = new(window.AudioContext || window.webkitAudioContext)();
const duration = 0.5; // in seconds
const minF = 20; //Hz
const maxF = 20000;
const freqRange = maxF - minF;
let curMaxF;
let curMinF;
let finalCoords = {};
let startTimeIdx;
let endTimeIdx;

window.onload = () => {

    // Create buttons and canvas
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const playFiltBut = document.getElementById('playFilteredButton')
    const filterCanvas = document.getElementById('filterCanvas');
    const ctxRect = filterCanvas.getContext('2d');

    // Create source and noise so they can be accessed in later scopes
    let source;
    const noise = fCreateNoiseSample(ctxAudio, duration); // Noise buffer

    // Play repeating noise
    playButton.onclick = () => {

        // Create the buffer source and connect to the filter chain
        source = ctxAudio.createBufferSource();
        source.buffer = noise;
        source.loop = true; // Repeat the noise in a loop
        source.connect(ctxAudio.destination); // Connect source to bandpass filter
        source.start(ctxAudio.currentTime); // Start playing the noise
        source.onended = () => {
            playButton.disabled = false; // Re-enable button after playback
        };
        playButton.disabled = true; // Disable button during playback
        stopButton.disabled = false;
    };

    // Stop repeating noise
    stopButton.addEventListener("click", () => {
        source.stop(ctxAudio.currentTime); 
        playButton.disabled = false;
        stopButton.disabled = true;
    });

    // Define rectangle properties before drawing
    let rectWidth = 380; 
    let rectHeight = 180;   
    let zeroX = 0;  // starting x position
    let zeroY = 0; // Because top left is 0, canvas height is 180, and rec height is 50   

    // Function to log coordinates of rectangle
    function updateCoords() {
        finalCoords.topLeft = {x: zeroX, y: zeroY};
        finalCoords.topRight = {x: zeroX+rectWidth, y: zeroY}
        finalCoords.bottomLeft =  {x:zeroX, y: zeroY + rectHeight};
        finalCoords.bottomRight = {x: zeroX + rectWidth, y: zeroY + rectHeight} 
    }
    updateCoords()

    // Draw the rectangle
    function drawRectangle() {
        ctxRect.clearRect(0, 0, filterCanvas.width, filterCanvas.height); 
        ctxRect.fillStyle = 'rgba(0, 0, 0, 0.3)'; 

        // Limit boundaries of rectangle to filter canvas boundaries
        if (finalCoords.bottomRight.y > filterCanvas.height){
            rectHeight = filterCanvas.height - finalCoords.topLeft.y;
            ctxRect.fillRect(zeroX, zeroY, rectWidth, rectHeight);
        }
        else if (finalCoords.bottomRight.x > filterCanvas.width){
            rectWidth = filterCanvas.width - finalCoords.topLeft.x;
            ctxRect.fillRect(zeroX, zeroY, rectWidth, rectHeight);
        }
        else{
            ctxRect.fillRect(zeroX, zeroY, rectWidth, rectHeight);
        }
    }
    drawRectangle();

    // Keyboard controls
    document.addEventListener('keydown', (event) => {

        //adjust time in larger steps than frequency
        let freqChange = 1;
        let timeChange = 2;
    
        //keyboard controls 
        switch (event.key) {
            case 'ArrowUp':
                zeroY = Math.max(0, zeroY - freqChange);
                break;
            case 'ArrowDown':
                zeroY = Math.min(filterCanvas.height - rectHeight, zeroY + freqChange);
                break;
            case 'ArrowLeft':
                zeroX = Math.max(0, zeroX - timeChange);
                break;
            case 'ArrowRight':
                zeroX = Math.min(filterCanvas.width - rectWidth, zeroX + timeChange);
                break;
            case 'w':
                rectWidth += timeChange;  // Increase width
                break;
            case 's':
                rectWidth = Math.max(timeChange, rectWidth - timeChange);  // Decrease width
                break;
            case 'h':
                rectHeight += freqChange;  // Increase height
                break;
            case 'j':
                rectHeight = Math.max(freqChange, rectHeight - freqChange);  // Decrease height
                break;
            default:
                return; 
        }
            
        updateCoords(); //update coordinates after interaction so they can be used to calculate time-freq cut offs
        drawRectangle();
    });    

    // Play filtered noise button - apply filter to noise using previously obtained values
    playFiltBut.addEventListener("click", () => {

        //Translate rectangle height to frequency bearing in mind that frequency is scaled down
        curMaxF = Math.abs(((finalCoords.topLeft.y/filterCanvas.height)*freqRange) - maxF);
        curMinF = Math.max(minF,maxF - (minF + (finalCoords.bottomLeft.y/filterCanvas.height)*freqRange)); // ensure minimum freq is 20Hz
        
        console.log('low cut off at: ' + curMinF,'high cut off at: ' + curMaxF); // Confirm filter values are correct

        //Translate rectangle width to time segment (intuitive scaling)
        startTimeIdx = Math.floor((finalCoords.bottomLeft.x/filterCanvas.width)*noise.length);
        endTimeIdx = Math.floor((finalCoords.bottomRight.x/filterCanvas.width)*noise.length);
        console.log('start index at: ' + startTimeIdx,'end index at: ' + endTimeIdx); // Confirm time indices are correct


        // Copy noise source that can be manipultated without affecting original noise
        let noiseCopy = {}; 
        noiseCopy = fCopyBuffer(ctxAudio,noise)

        // Create a buffer that is a mix of repeated and non-repeated noise
        let repeats = 2;
        const mixedNoise = fMixNoise(ctxAudio,noiseCopy, repeats, startTimeIdx, endTimeIdx);

        console.log(mixedNoise.getChannelData(0).slice(startTimeIdx,startTimeIdx+2))
        console.log(noiseCopy.getChannelData(0).slice(0,2))

        // Declare new source as source was terminated by stop button
        source = ctxAudio.createBufferSource();
        source.buffer = mixedNoise;
        source.loop = false; // no repeat this time
        source.connect(ctxAudio.destination);

        // Create filter, connect to source and play source
        const filter = fcreateBPFilter(ctxAudio, curMinF, curMaxF);
        source.connect(filter).connect(ctxAudio.destination);
        source.start(ctxAudio.currentTime);
        playFiltBut.disabled = true;
        source.onended = () => {
            playFiltBut.disabled = false;
            playButton.disabled = false;
        };
    });
};




