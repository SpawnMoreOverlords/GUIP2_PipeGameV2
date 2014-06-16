//html5 canvas
var _stage;
var _canvas;

//animation variable
var fps = 60;
var AnimationLoopCounter = 0;

// Pipe grid variables
var _pipegrid_rows = 6;
var _pipegrid_cols = 6;         
var _puzzleWidth;
var _puzzleHeight;

//Pipe variables
var _pipeWidth;
var _pipeHeight;
var _currentPipe;

//mouse coordinates
var _mouse;

//Undo and redo stack
var PipesStack = [];
var RedoStack = [];

//Pipe class
function Pipe() {
    this.orientation = 0;
    this.xPos = 0;
    this.yPos = 0;
    this.width = 0;
    this.height = 0;
    this.openLeft = false;
    this.openUp = false;
    this.openRight = false;
    this.openDown = false;
    this.transparency = 1;
    this.image = null;

    this.connectedToA = false;
    this.connectedToB = false;
}

//array to store the pipe struct in
var _pipe_grid = [];

// Set the straight and bent pipe images up, so they can be referenced
// by the pipe objects 
function init() {
    _img_splash = new Image();
    _img_splash.addEventListener('load', onImage, false);
    _img_splash.src = "SplashScreen.png";

    _img_straight = new Image();
    _img_straight.addEventListener('load', onImage, false);
    _img_straight.src = "straightpipe-01.png";

    _img_bent = new Image();
    _img_bent.addEventListener('load', onImage, false);
    _img_bent.src = "bentpipe-01.png";

    _img_win = new Image();
    _img_win.addEventListener('load', onImage, false);
    _img_win.src = "youwin.png";
    
    _img_help = new Image();
    _img_help.addEventListener('load', onImage, false);
    _img_help.src = "glasspane-help.jpg";
}

// Set the width and height for each pipe, dependant on the number of pipes
function onImage(e) {
    _pipeWidth = Math.floor(_img_straight.width);
    _pipeHeight = Math.floor(_img_straight.height);
    _puzzleWidth = _pipeWidth * _pipegrid_cols;
    _puzzleHeight = _pipeHeight * _pipegrid_rows;
    setCanvas();
    initGrid();
}

// Set Canvas
function setCanvas() {
    _canvas = document.getElementById('canvas');
    _stage = _canvas.getContext('2d');
    _canvas.width = _puzzleWidth;
    _canvas.height = _puzzleHeight;
    _canvas.style.border = "1px solid black";
    //_canvas.offsetLeft = 200;
}

// Init variables for the pipe puzzle (before the pipes are randomized)
function initGrid() {
    //_pipe_grid = [];
    _mouse = {x: 0, y: 0};
    _currentpipe = null;
    _currentDroppipe = null;
    //Draw a start up image :)
    _stage.drawImage(_img_splash, 0, 0, _puzzleWidth, _puzzleHeight, 0, 100, _puzzleWidth, _puzzleHeight);
    createTitle("Double click to start game!!");
    document.onmousedown = buildGrid;
}

//Create a fillable rectangle, place text inside of it.
function createTitle(msg) {
    //Create a fillable rectangle, params: fillRect(x, y, width, height). 
    //Where x and y are the coordinates of the upper left corners position.
    _stage.fillStyle = "#000000";
    _stage.globalAlpha = .4;
    _stage.fillRect(100, _puzzleHeight - 40, _puzzleWidth - 200, 40);
    _stage.fillStyle = "#FFFFFF";
    _stage.globalAlpha = 1;

    //Place a message inside of the fillable rectangle. 
    _stage.textAlign = "center";
    _stage.textBaseline = "middle";
    _stage.font = "20px Arial";
    _stage.fillText(msg, _puzzleWidth / 2, _puzzleHeight - 20);
}

//Init an array of all of the pipe puzzle pipes. 
function buildGrid() {
    var i;
    var xPosition = 0;
    var yPosition = 0;
    for (i = 0; i < _pipegrid_cols * _pipegrid_rows; i++) {

        //Create a new pipe object
        var newPipe = new Pipe();
        newPipe.xPos = xPosition;
        newPipe.yPos = yPosition;

        //Randomize between bent and straight pipes  
        if (Math.random() < 0.5) {
            if (newPipe.image === null)
                newPipe.image = _img_straight;
            newPipe.openLeft = true;
            newPipe.openUp = false;
            newPipe.openRight = true;
            newPipe.openDown = false;
        }
        else {
            if (newPipe.image === null)
                newPipe.image = _img_bent;
            newPipe.openLeft = true;
            newPipe.openUp = false;
            newPipe.openRight = false;
            newPipe.openDown = true;
        }

        //Push pipe structure into the pipe grid array!
        _pipe_grid.push(newPipe);

        //Update the position ready for the placement of next pipe:
        xPosition += _pipeWidth;
        if (xPosition >= _puzzleWidth) {
            xPosition = 0;
            yPosition += _pipeHeight;
        }
    }
    //Set the mouse down command to call the ShufflePuzzle method
    document.onmousedown = drawPuzzle;
}

//Shuffle the array, clear the stage, replace the pieces. 
function drawPuzzle() {
    //_pipe_grid = shuffleArray(_pipe_grid);
    _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
    var i;
    var pipe;
    for (i = 0; i < _pipe_grid.length; i++) {
        pipe = _pipe_grid[i];

        _stage.drawImage(pipe.image, pipe.xPos, pipe.yPos, _pipeWidth, _pipeHeight);
        _stage.strokeRect(pipe.xPos, pipe.yPos, _pipeWidth, _pipeHeight);
    }
    //Set the mouse down command to call the onPuzzleClick method
    document.onmousedown = onPuzzleClick;
}

//To redraw the whole puzzle mid game. 
function redrawPuzzle () {
    //Clear all
    _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
    var i;
    var pipe;
    for (i = 0; i < _pipe_grid.length; i++) {
        
        //Get each pipe out of the pipe_grid array
        pipe = _pipe_grid[i];
        
        
        //Then REDRAW its current position/orientation/etc..
        // save the unrotated context of the canvas so we can restore it later
        // the alternative is to untranslate & unrotate after drawing
        _stage.save();
        // move to the center of the canvas
        _stage.translate(pipe.xPos + (_pipeWidth / 2), pipe.yPos + (_pipeHeight / 2));
        _stage.globalAlpha = 1; //Set transparency					
        // rotate the canvas to the specified degrees
        _stage.rotate(pipe.orientation * Math.PI / 180);
        // draw the image
        // since the context is rotated, the image will be rotated also.
        _stage.drawImage(pipe.image, -_img_straight.width / 2, -_img_straight.width / 2);
        // we’re done with the rotating so restore the unrotated context
        _stage.restore();
        //add the border again after restoring the translate and rotate states.
        _stage.strokeRect(pipe.xPos, pipe.yPos, _pipeWidth, _pipeHeight);
    }
}

//On click functionality -- rotates the clicked pipe
function onPuzzleClick(e) {

    NormalOrUndoClick = 1;

    if (e.layerX || e.layerX === 0) {
        _mouse.x = e.layerX - _canvas.offsetLeft;
        _mouse.y = e.layerY - _canvas.offsetTop;
    }
    else if (e.offsetX || e.offsetX === 0) {
        _mouse.x = e.offsetX - _canvas.offsetLeft;
        _mouse.y = e.offsetY - _canvas.offsetTop;
    }
    _currentPipe = checkpipeClicked();
    
    //HistoryList(_currentPipe);

    if (_currentPipe !== null) {
        
        //Redraw the whole grid, to cover the glasspane help system if the 
        //user has pressed it previously.
        redrawPuzzle();
        
        
        updateOrientation(_currentPipe);
        AnimationLoop(_currentPipe);
        //adds it to the stack 
        PipesStack.push(_currentPipe);
        //document.getElementById("num_of_things_in_the_stack").innerHTML = 'num_of_things_in_the_stack: ' + PipesStack.length;
        document.getElementById("undoButton").disabled = false;  
    }
    
}

function undo() {
    var last_pipe = PipesStack.pop();

    //if undo stack is empty then disable the button.
    if (PipesStack.length === 0) {
        document.getElementById("undoButton").disabled = true;
    }

    //push an item to the redostack and enable  the button
    RedoStack.push(last_pipe);
    document.getElementById("redoButton").disabled = false;
    //document.getElementById("last_element").innerHTML = 'Last Elements XPosition: ' + last_pipe.xPos;

    //REDRAW:
    _stage.clearRect(last_pipe.xPos, last_pipe.yPos, _pipeWidth, _pipeHeight);
    // save the unrotated context of the canvas so we can restore it later
    // the alternative is to untranslate & unrotate after drawing
    _stage.save();
    // move to the center of the canvas
    _stage.translate(last_pipe.xPos + (_pipeWidth / 2), last_pipe.yPos + (_pipeHeight / 2));
    _stage.globalAlpha = 1; //Set transparency             
    updateOrientationForUndo(last_pipe); //update orientation of the pipe
    // rotate the canvas to the specified degrees
    _stage.rotate(last_pipe.orientation * Math.PI / 180);
    // draw the image
    // since the context is rotated, the image will be rotated also.
    _stage.drawImage(last_pipe.image, -_img_straight.width / 2, -_img_straight.width / 2);
    // we’re done with the rotating so restore the unrotated context
    _stage.restore();
    //add the border again after restoring the translate and rotate states.
    _stage.strokeRect(last_pipe.xPos, last_pipe.yPos, _pipeWidth, _pipeHeight);
}

function redo() {
    var last_pipe_in_redo = RedoStack.pop();

    //if undo stack is empty then disable the button.
    if (RedoStack.length === 0) {
        document.getElementById("redoButton").disabled = true;
    }

    //push a pipe to the undo stack, enable the undo button.
    PipesStack.push(last_pipe_in_redo);
    //document.getElementById("num_of_things_in_the_stack").innerHTML = 'num_of_things_in_the_stack: ' + PipesStack.length;
    document.getElementById("undoButton").disabled = false;

    //REDRAW:
    _stage.clearRect(last_pipe_in_redo.xPos, last_pipe_in_redo.yPos, _pipeWidth, _pipeHeight);
    // save the unrotated context of the canvas so we can restore it later
    // the alternative is to untranslate & unrotate after drawing
    _stage.save();
    // move to the center of the canvas
    _stage.translate(last_pipe_in_redo.xPos + (_pipeWidth / 2), last_pipe_in_redo.yPos + (_pipeHeight / 2));
    _stage.globalAlpha = 1; //Set transparency 
    updateOrientation(last_pipe_in_redo); //update orientation of the pipe
    // rotate the canvas to the specified degrees
    _stage.rotate(last_pipe_in_redo.orientation * Math.PI / 180);
    // draw the image
    // since the context is rotated, the image will be rotated also.
    _stage.drawImage(last_pipe_in_redo.image, -_img_straight.width / 2, -_img_straight.width / 2);
    // we’re done with the rotating so restore the unrotated context
    _stage.restore();
    //add the border again after restoring the translate and rotate states.
    _stage.strokeRect(last_pipe_in_redo.xPos, last_pipe_in_redo.yPos, _pipeWidth, _pipeHeight);
}

//Check to see if the user has clicked on a pipe
//If they have, return the pipe object
function checkpipeClicked() {
    var i;
    var pipe;
    for (i = 0; i < _pipe_grid.length; i++) {
        pipe = _pipe_grid[i];
        
            console.log('working?? ');
        
        if (_mouse.x < pipe.xPos || _mouse.x > (pipe.xPos + _pipeWidth) || _mouse.y < pipe.yPos || _mouse.y > (pipe.yPos + _pipeHeight)) {
            //pipe NOT HIT
        }
        if (_mouse.x < pipe.xPos || _mouse.x > (pipe.xPos + _pipeWidth) || _mouse.y < pipe.yPos || _mouse.y > (pipe.yPos + _pipeHeight)) {
            //pipe NOT HIT
        }
        else {
            return pipe;
        }
    
        
    }
    return null;
}

//Call this function to initalise a new game.
function gameOver() {
    document.onmousedown = null;
    document.onmousemove = null;
    document.onmouseup = null;
    initPuzzle();
}

function updateOrientation(currentPipe) {

    currentPipe.orientation += 90;

    if (currentPipe.orientation === 360) {
        currentPipe.orientation = 0;
    }

    if (currentPipe.image === _img_straight) {
        if (currentPipe.orientation === 0 || currentPipe.orientation === 180) {
            currentPipe.openLeft = true;
            currentPipe.openUp = false;
            currentPipe.openRight = true;
            currentPipe.openDown = false;
        }
        else {
            currentPipe.openLeft = false;
            currentPipe.openUp = true;
            currentPipe.openRight = false;
            currentPipe.openDown = true;
        }
    }

    if (currentPipe.image === _img_bent) {
        if (currentPipe.orientation === 0) {
            currentPipe.openLeft = true;
            currentPipe.openUp = false;
            currentPipe.openRight = false;
            currentPipe.openDown = true;
        }
        else if (currentPipe.orientation === 90) {
            currentPipe.openLeft = true;
            currentPipe.openUp = true;
            currentPipe.openRight = false;
            currentPipe.openDown = false;
        }
        else if (currentPipe.orientation === 180) {
            currentPipe.openLeft = false;
            currentPipe.openUp = true;
            currentPipe.openRight = true;
            currentPipe.openDown = false;
        }
        else if (currentPipe.orientation === 270) {
            currentPipe.openLeft = false;
            currentPipe.openUp = false;
            currentPipe.openRight = true;
            currentPipe.openDown = true;
        }
    }

    //document.getElementById("test1").innerHTML = 'left= ' + currentPipe.openLeft;
    //document.getElementById("test2").innerHTML = 'up= ' + currentPipe.openUp;
    //document.getElementById("test3").innerHTML = 'right= ' + currentPipe.openRight;
    //document.getElementById("test4").innerHTML = 'down= ' + currentPipe.openDown;
}

function updateOrientationForUndo(currentPipe) {

    currentPipe.orientation -= 90;

    if (currentPipe.orientation === 360) {
        currentPipe.orientation = 0;
    }

    if (currentPipe.image === _img_straight) {
        if (currentPipe.orientation === 0 || currentPipe.orientation === 180) {
            currentPipe.openLeft = true;
            currentPipe.openUp = false;
            currentPipe.openRight = true;
            currentPipe.openDown = false;
        }
        else {
            currentPipe.openLeft = false;
            currentPipe.openUp = true;
            currentPipe.openRight = false;
            currentPipe.openDown = true;
        }
    }

    if (currentPipe.image === _img_bent) {
        if (currentPipe.orientation === 0) {
            currentPipe.openLeft = true;
            currentPipe.openUp = false;
            currentPipe.openRight = false;
            currentPipe.openDown = true;
        }
        else if (currentPipe.orientation === 90) {
            currentPipe.openLeft = true;
            currentPipe.openUp = true;
            currentPipe.openRight = false;
            currentPipe.openDown = false;
        }
        else if (currentPipe.orientation === 180) {
            currentPipe.openLeft = false;
            currentPipe.openUp = true;
            currentPipe.openRight = true;
            currentPipe.openDown = false;
        }
        else if (currentPipe.orientation === 270) {
            currentPipe.openLeft = false;
            currentPipe.openUp = false;
            currentPipe.openRight = true;
            currentPipe.openDown = true;
        }
    }

    //document.getElementById("test1").innerHTML = 'left= ' + currentPipe.openLeft;
    //document.getElementById("test2").innerHTML = 'up= ' + currentPipe.openUp;
    //document.getElementById("test3").innerHTML = 'right= ' + currentPipe.openRight;
    //document.getElementById("test4").innerHTML = 'down= ' + currentPipe.openDown;
}

//Check if there is a connection between the start and end points :)!
function checkConnection(_currentpipe_index) {
    var pipe = _pipe_grid[_currentpipe_index];

    if (pipe.image === _img_straight)
    {
        //document.getElementById("demo1").innerHTML = "hello" + _currentpipe_index; (already commented out)
        if (_currentpipe_index !== 35 && _currentpipe_index !== 0 && _currentpipe_index !== 35 && pipe.openLeft === true && pipe.openRight === true && _pipe_grid[_currentpipe_index + 1].openLeft === true && (_previouspipe_index - _currentpipe_index === -1) && (_currentpipe_index + 1 >= 0 && _currentpipe_index + 1 < 36)) {
            _currentpipe_index += 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && _currentpipe_index === 0 && pipe.openLeft === true && pipe.openRight === true) {
            _currentpipe_index += 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && _currentpipe_index !== 0 && pipe.openLeft === true && pipe.openRight === true && _pipe_grid[_currentpipe_index - 1].openRight === true && (_previouspipe_index - _currentpipe_index === 1) && (_currentpipe_index - 1 >= 0 && _currentpipe_index - 1 < 36)) {
            _currentpipe_index -= 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index += 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openUp === true && pipe.openDown === true && _pipe_grid[_currentpipe_index + 6].openUp === true && (_previouspipe_index - _currentpipe_index === -6) && (_currentpipe_index + 6 >= 0 && _currentpipe_index + 6 < 36)) {
            _currentpipe_index += 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 6;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openUp === true && pipe.openDown === true && _pipe_grid[_currentpipe_index - 6].openDown === true && (_previouspipe_index - _currentpipe_index === 6) && (_currentpipe_index - 6 >= 0 && _currentpipe_index - 6 < 36)) {
            _currentpipe_index -= 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index += 6;
            checkConnection(_currentpipe_index);
        }
    }
    else if (pipe.image === _img_bent)
    {
        //document.getElementById("demo2").innerHTML = _currentpipe_index;

        if (_currentpipe_index !== 35 && _currentpipe_index === 0 && pipe.openLeft === true && pipe.openDown === true && _pipe_grid[_currentpipe_index + 6].openUp === true && (_currentpipe_index + 6 >= 0 && _currentpipe_index + 6 < 36)) {
            _currentpipe_index += 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 6;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && _currentpipe_index !== 0 && pipe.openLeft === true && pipe.openDown === true && _pipe_grid[_currentpipe_index + 6].openUp === true && (_previouspipe_index - _currentpipe_index === -1) && (_currentpipe_index + 6 >= 0 && _currentpipe_index + 6 < 36)) {
            _currentpipe_index += 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 6;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && _currentpipe_index !== 0 && pipe.openLeft === true && pipe.openDown === true && _pipe_grid[_currentpipe_index - 1].openRight === true && (_previouspipe_index - _currentpipe_index === 6) && (_currentpipe_index - 1 >= 0 && _currentpipe_index - 1 < 36)) {
            _currentpipe_index -= 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index += 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openLeft === true && pipe.openUp === true && _pipe_grid[_currentpipe_index - 6].openDown === true && (_previouspipe_index - _currentpipe_index === -1) && (_currentpipe_index - 6 >= 0 && _currentpipe_index - 6 < 36)) {
            _currentpipe_index -= 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index += 6;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openLeft === true && pipe.openUp === true && _pipe_grid[_currentpipe_index - 1].openRight === true && (_previouspipe_index - _currentpipe_index === -6) && (_currentpipe_index - 1 >= 0 && _currentpipe_index - 1 < 36)) {
            _currentpipe_index -= 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index += 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openRight === true && pipe.openDown === true && _pipe_grid[_currentpipe_index + 6].openUp === true && (_previouspipe_index - _currentpipe_index === 1) && (_currentpipe_index + 6 >= 0 && _currentpipe_index + 6 < 36)) {
            _currentpipe_index += 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 6;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openRight === true && pipe.openDown === true && _pipe_grid[_currentpipe_index + 6].openUp === true && (_previouspipe_index - _currentpipe_index === 6) && (_currentpipe_index + 1 >= 0 && _currentpipe_index + 1 < 36)) {
            _currentpipe_index += 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openRight === true && pipe.openUp === true && _pipe_grid[_currentpipe_index + 1].openLeft === true && (_previouspipe_index - _currentpipe_index === -6) && (_currentpipe_index + 1 >= 0 && _currentpipe_index + 1 < 36)) {
            _currentpipe_index += 1;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index -= 1;
            checkConnection(_currentpipe_index);
        }
        if (_currentpipe_index !== 35 && pipe.openRight === true && pipe.openUp === true && _pipe_grid[_currentpipe_index + 1].openDown === true && (_previouspipe_index - _currentpipe_index === -1) && (_currentpipe_index + 1 >= 0 && _currentpipe_index + 1 < 36)) {
            _currentpipe_index -= 6;
            _previouspipe_index = _currentpipe_index;
            _previouspipe_index += 6;
            checkConnection(_currentpipe_index);
        }
    }
    if (_currentpipe_index === 35 && _pipe_grid[35].openRight === true) {
        //document.getElementById("demo3").innerHTML = 'YOU WON';
        //Draw a start up image :)
        _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
        _stage.drawImage(_img_win, 0, 0, _puzzleWidth, _puzzleHeight, 0, 100, _puzzleWidth, _puzzleHeight); 
    }
}

//Check if the player has won.
function checkWin() {
    if (_pipe_grid[0].openLeft === true) {
        checkConnection(0);
    }
}

//Animate the pipe rotation
function AnimationLoop(Pipe) {
    var looper;
    var ending = true;
    document.onmousedown = null;
    looper = setTimeout(function() {
        AnimationLoopCounter++;
        if (AnimationLoopCounter % 90 === 0) {
            clearTimeout(looper);
            //document.getElementById("status1").innerHTML = counter;
            AnimationLoopCounter = 0;
            //SetOpacity(el, 100);
            ending = false;
        }

        if (!ending)
        {
            Rotating(Pipe, 90,1);
            //Redraw whole grid to remove left over pixels that've leaked into
            //other pipe squares during the animation process.
            redrawPuzzle();
            document.onmousedown = onPuzzleClick;
        }
        else {
            //Redraw whole grid to remove left over pixels that've leaked into
            //other pipe squares during the animation process.
            redrawPuzzle();
            Rotating(Pipe, AnimationLoopCounter,0.5);   
        }

        if (ending) {
            AnimationLoop(Pipe, AnimationLoopCounter);
        }

    }, 250 / fps)
}

//Rotate and redraw the pipe
function Rotating(Pipe, AnimationLoopCounter,Transparency) {
    //REDRAW:
    _stage.clearRect(Pipe.xPos, Pipe.yPos, _pipeWidth, _pipeHeight);
    // save the unrotated context of the canvas so we can restore it later
    // the alternative is to untranslate & unrotate after drawing
    _stage.save();
    // move to the center of the canvas
    _stage.translate(Pipe.xPos + (_pipeWidth / 2), _currentPipe.yPos + (_pipeHeight / 2));
    _stage.globalAlpha = Transparency; //Set transparency					
    // rotate the canvas to the specified degrees
    _stage.rotate(((Pipe.orientation + AnimationLoopCounter) - 90) * Math.PI / 180);
    // draw the image
    // since the context is rotated, the image will be rotated also.
    _stage.drawImage(Pipe.image, -_img_straight.width / 2, -_img_straight.width / 2);
    // we’re done with the rotating so restore the unrotated context
    _stage.restore();
    //add the border again after restoring the translate and rotate states.
    _stage.strokeRect(Pipe.xPos, Pipe.yPos, _pipeWidth, _pipeHeight);
}

function drawHelp () {
   //Draw glasspane help image
   _stage.globalAlpha = 0.75; //Set transparency
   _stage.drawImage(_img_help, 0, 0, _puzzleWidth, _puzzleHeight, 0, 0, _puzzleWidth, _puzzleHeight); 
   _stage.globalAlpha = 1; //Set transparency
}



