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

    // Create canvas
    const filterCanvas = document.getElementById('filterCanvas');
    const ctxRect = filterCanvas.getContext('2d');

    // Create global variables so they can be accessed in later scopes
    let source;
    let state;
    const noise = fCreateNoiseSample(ctxAudio, duration); // Noise buffer

    //Obtain Q factor for BP filer
    let qSlider = document.getElementById("QRange");
    let qInput = document.getElementById("qInput");

    qSlider.addEventListener("input", () =>{
        qInput.value = qSlider.value;
    });
    
    qInput.addEventListener("input",() => {
        qSlider.value = qInput.value;
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
    document.onkeydown = (event) => {

        //adjust time in larger steps than frequency
        let freqChange = 2;
        let timeChange = 3;

        // Change rectangle height
        if (event.key === 'h'){
            state = 'height'
            console.log(state)
        }
        else if (state === 'height' && event.key === '+'){
            console.log('increase')
            rectHeight += freqChange;
        }
        else if (state === 'height' && event.key === '-'){
            console.log('decrease height')
            rectHeight = Math.max(freqChange, rectHeight - freqChange);
        }

        // Change rectangle width
        else if (event.key === 'w'){
            state = 'width'
        }
        else if (state ==='width' && event.key === '+'){
            rectWidth += timeChange;
        }
        else if (state === 'width' && event.key === '-'){
            rectWidth = Math.max(timeChange, rectWidth - timeChange);
        }
        else if (event.key === 'ArrowUp'){
            zeroY = Math.max(0, zeroY - freqChange);
        }
        else if (event.key === 'ArrowDown'){
            zeroY = Math.min(filterCanvas.height - rectHeight, zeroY + freqChange);
        }
        else if (event.key === 'ArrowLeft'){
            zeroX = Math.max(0, zeroX - timeChange);
        }
        else if (event.key === 'ArrowRight'){
            zeroX = Math.min(filterCanvas.width - rectWidth, zeroX + timeChange);
        }

        //update coordinates after interaction so they can be used to calculate time-freq cut offs
        updateCoords(); 
        drawRectangle();

        // Enable keyboard to handle events
        if (event.key === "1"){
            state = 'repeated noise';
            console.log(state)
        }
        //play repeated noise
        else if (state === 'repeated noise' && event.key === 'Enter'){
            console.log('play repeated noise')
            // Create the buffer source and connect to the filter chain
            source = ctxAudio.createBufferSource();
            source.buffer = noise;
            source.loop = true; 
            source.connect(ctxAudio.destination)
            source.start(ctxAudio.currentTime); 
        }
        //stop noise
        else if (state === 'repeated noise'  && event.key === 'Escape' || state === 'filtered noise' && event.key === 'Escape'){
        console.log('stop noise')
        source.stop(ctxAudio.currentTime); 
        state = null;
        }
        // prepare filtered noise
        else if (event.key === '2'){
            state = 'filtered noise'
            console.log(state)
        }
        // play filtered noise
        else if (state === 'filtered noise' && event.key === 'Enter'){
            console.log('play filtered noise')
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
            console.log(noiseCopy.getChannelData(0).slice(startTimeIdx,startTimeIdx+2))

            // Declare new source as source was terminated by stop button
            source = ctxAudio.createBufferSource();
            source.buffer = mixedNoise;
            source.loop = false; // no repeat this time
            source.connect(ctxAudio.destination);

            // Create filter, connect to source and play source
            let Q = qSlider.value;
            const filter = fcreateBPFilter(ctxAudio, Q, curMinF, curMaxF);
            source.connect(filter).connect(ctxAudio.destination);
            source.start(ctxAudio.currentTime);
            state = null;  
            
        }
    }
};  