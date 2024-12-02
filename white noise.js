// Import functions
import { fCreateNoiseSample } from "./functions/CreateNoise.js";
import { fcreateBPFilter } from "./functions/BPFilter.js";
import { fCopyBuffer } from "./functions/copyBuffer.js";
import { fMixNoise } from "./functions/mixNoise.js";

//// Declare global variables ////
const ctxAudio = new(window.AudioContext || window.webkitAudioContext)();
const duration = 0.5; // in seconds
const minF = 0; //Hz
const maxF = 20000;
const freqRange = maxF - minF;
const noise = fCreateNoiseSample(ctxAudio, duration); // Noise buffer

// let variables that can be modified based on user input
let curMaxF;
let curMinF;
let finalCoords = {};
let startTimeIdx;
let endTimeIdx;
let source;
let state = null;

window.onload = () => {

    // Event listners
    const filterCanvas = document.getElementById('filterCanvas');
    const ctxRect = filterCanvas.getContext('2d');
    const repID = document.getElementById("reps");

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
    let shifted = false;

    // Keyboard controls
    document.onkeydown = (event) => {

        //adjust time in larger steps than frequency
        let freqChange = 2;
        let timeChange = 3;

        // Handle events that are shifted 
        if (event.shiftKey && shifted === false){
            shifted = true;
            console.log('shifted')
        }
        else if (event.shiftKey && shifted === true){
            shifted = false;
            console.log('unshifted')
        }
            
        // Change rectangle height
        if (event.key === 'h' && shifted === false){
            rectHeight += freqChange;
        }
        else if (event.key === 'h' && shifted === true){
            rectHeight = Math.max(freqChange, rectHeight - freqChange);
        }
        // Change rectangle width
        else if (event.key === 'w' && shifted === false){
            rectWidth += timeChange;
        }
        else if (event.key === 'w' && shifted === true){
            rectWidth = Math.max(timeChange, rectWidth - timeChange);
        }
        // Move rectangle
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

        const states = ['repeated noise','filtered noise']; // define possible states
        // Play repeated noise
        if (state === null && event.key === "1"){
            state = states[0]
            // Create the buffer source and connect to the filter
            source = ctxAudio.createBufferSource();
            source.buffer = noise;
            source.loop = true; 
            source.connect(ctxAudio.destination)
            source.start(ctxAudio.currentTime);
        }
        //stop noise 
        else if (states.includes(state) && event.key === 'Escape'){
            source.stop(ctxAudio.currentTime);
            state = null;
        }
        // prepare filtered noise
        else if (state === null && event.key === '2'|| state === states[1] && event.key === '2'){
            state = states[1];
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
            let repeats = repID.value;
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
            // crucially, once the source ends, reset the state to null to enable either repeated/filtered noise to play
            source.onended = () =>{
                state = null;
            }
        }
    }
};  
