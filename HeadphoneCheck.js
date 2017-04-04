(function(HeadphoneCheck, $, undefined) {

  /*** PUBLIC CONFIGURATION VARIABLES ***/
  HeadphoneCheck.examplesPerPage = 2;
  HeadphoneCheck.debug = true;
  HeadphoneCheck.calibration = true;

  /*** PRIVATE CONFIGURATION VARIABLES ***/
  var doShuffleTrials = true;
  var validColor = "black";
  var warningColor = "red";
  var requirePlayback = true;
  var defaultAudioType = "audio/mpeg";

  var totalCorrect = 0;
  var stimMap = [];
  var calibration = [];
  var lastPage;
  var st_isPlaying = false;

  //PRIVATE FUNCTIONS
  function updateCorrect(stim, response) {
    if (stim.correct == response) {
      totalCorrect++;
    }
  }

  //FUNCTIONS FOR INITIALIZING THE STIMULI AND SHUFFLING THE JSON FILE
  function shuffleTrials(data) {
    stimMap = shuffle(data.stim); //shuffles the array
  }

  // TODO: fix this, this doesn"t work
  function parseAudioType(stimID) {
    console.log("TYPE: " +stimID);
    console.log(stimMap);
    var typeStr = stimMap[stimID];
    console.log("TYPE: "+typeStr);
    if (typeStr === undefined) {
      typeStr = defaultAudioType;
    }
    console.log("TYPE: "+typeStr);
    return typeStr;
  }

  function checkPassFail(correctThreshold) {
    if (totalCorrect >= correctThreshold) {
      return true;
    }
    else { return false; }
  }

  function playStim(stimID) {
    var stimFile = "audio" + stimID;
    // set onended callback
    $("#" + stimFile).on("ended", function() {
      // reset playback state
      st_isPlaying = false;
      // activate responses
      if (requirePlayback) {
        $("#radioButtons" + stimID).css("pointer-events", "auto");
      }
    });

    $('#b' + stimID).css('border', 'none');
    $("#" + stimFile).get(0).play();
    st_isPlaying = true;
    // hack to disable responding during playback
    $("#radioButtons" + stimID).css("pointer-events", "none");
  }

  function playCalibration(calibrationFile) {
    $("#" + calibrationFile).on("ended", function() {
      // reset playback state
      st_isPlaying = false;
    });
    $("#" + calibrationFile).get(0).play();
    st_isPlaying = true;
  }

  function disableClick(buttonID) {
    $("#" + buttonID).prop("disabled", true);
  }

  function checkCanContinue() {
    // Check that each question has a response, if not, highlight what is needed
    // TODO: This is HACKY and probably isn"t the best idea
    numResponses = $(".ui-buttonset-vertical>label>input[type=radio]:checked").length;
    return numResponses >= HeadphoneCheck.examplesPerPage; // easy for user to circumvent check
  }

  function renderResponseWarnings() {
    // toggle the response warnings

    // get parent div of anything checked, should only be 1 radio button per div
    var checked = $(".ui-buttonset-vertical>label>input[type=radio]:checked").parent().parent();

    // get parent divs of anything unchecked, can be as many as # of responses
    var unchecked = $(".ui-buttonset-vertical>label>input[type=radio]").not(":checked").parent().parent();

    // get all top level divs (i.e., trial containers) without any responses
    var uncheckedTrials = $(unchecked).not(checked).parent();

    // hide warning on completed trials
    $(checked).parent().css("border", "5px solid " + validColor);

    // show warning on empty trials
    $(uncheckedTrials).css("border", "5px solid " + warningColor);
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  // renderHTML takes in the stimulus ID and the stimulus file and creates a div
  // element with everything needed to play and respond to this sound
  function renderOneTrialHTML(stimDiv, stimID, stimFile) {
    var divID = "stim" + stimID;
    console.log(divID);
    $("<div/>", {id: divID, class: "trialDiv"}).appendTo(("#" + stimDiv));

    //add in the audio source
    $("<audio/>", {
        id: "audio" + stimID,
        // type: "audio/mpeg", // TODO: Factor this out, should be user defined
        // type: parseAudioType(stimID),
        src: stimFile
      }).appendTo($("#" + divID));

    if (HeadphoneCheck.debug) {
      $("<div/>", {
          text: "Trial ID: " + stimID
      }).appendTo($("#" + divID));
    }

    //add in the button for playing the sound
    $("<button/>", {
      id: "b" + stimID,
      disabled: false,
      click: function () {
        if (!st_isPlaying){
          playStim(stimID);
          disableClick(this.id);
        }
        else {}
      },
      text: "Play"
    }).appendTo($("#" + divID));

    //add in the radio buttons for selecting which sound was softest
    $("<div/>", {
      id: "radioButtons"+stimID,
      class: "ui-buttonset-vertical",
      // width: "30%"
    }).appendTo($("#" + divID));

    //give the label info for the buttons
    var radioButtonInfo = [
                            {"id": "1", "name": "FIRST sound was SOFTEST" },
                            {"id": "2", "name": "SECOND sound was SOFTEST" },
                            {"id": "3", "name": "THIRD sound was SOFTEST"}
                          ];

    $.each(radioButtonInfo, function() {
      $("#radioButtons" + stimID).append(
        $("<label/>", {
          for: "radio" + this.id + '-stim' + stimID,
          class: "radio-label",
          text: this.name
        }).prepend(
            $("<input/>", {
                type: "radio",
                id: "radio" + this.id + '-stim' + stimID,
                name: "radio-resp" + stimID,
                class: "radio-responses",
                value: this.id
            })
          )
        );
    });
  }

  function teardownHTMLPage() {
    $("#container-exp").empty();
  }

  //PUBLIC FUNCTIONS
  // Load the experiment configuration from the server
  HeadphoneCheck.loadExamples = function (jsonpath) {
    $.ajax({
        dataType: "json",
        url: jsonpath,
        async: false,
        success: function (data) {
            if (HeadphoneCheck.debug) {
                console.log("Got configuration data");
            }
            if (doShuffleTrials) {
              shuffleTrials(data);
            }
            console.log("test");
            if (HeadphoneCheck.calibration) {
              calibration = data.calibration;
              console.log(calibration);
            }
            lastPage = Math.ceil(stimMap.length / HeadphoneCheck.examplesPerPage); //get last page
        }
    });
  };

  HeadphoneCheck.renderHTMLPage = function(pageNum) {
    //get the stimuli to display on this page
    var curStimuli = [];
    for (i = 0; i < HeadphoneCheck.examplesPerPage; i++) {
      curStimuli.push(stimMap[pageNum * HeadphoneCheck.examplesPerPage + i]);
    }

    $("<div/>", {
      id: "instruct",
      class: "warning",
      html: "When you hit <b>Play</b>, you will hear three sounds separated by silences."
    }).appendTo($("#container-exp"));


    $("<div/>", {
      class: "warning",
      text: "Simply judge WHICH SOUND WAS SOFTEST(quietest)-- 1, 2, or 3?"
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Test sounds can only be played once!"
    }).appendTo($("#container-exp"));

    // add in a group for each item in stimulus
    $.each(curStimuli, function () {
      renderOneTrialHTML("container-exp", this.id, this.stimFile);
    });

    if (requirePlayback) {
      // no response until the sound is played
      $(".ui-buttonset-vertical").click(function(event) {
        console.log(event.target);
        var parentPlayButton = $(event.target).parents().filter('.trialDiv').find('button');
        console.log($(parentPlayButton).prop('disabled'))
        // if the play button isn't disabled, it hasn't been played, so show a warning
        if (!$(parentPlayButton).prop('disabled')) {
          $(parentPlayButton).css('border', '3px solid red');
          event.preventDefault();
        }
      });
    }

    // Add button to continue
    $("<button/>", {
      class: "warning",
      // type: "button",
      text: "Continue",
      click: function () {
        var canContinue = checkCanContinue();
        for (stimID = 0; stimID < HeadphoneCheck.examplesPerPage; stimID++) {
          updateCorrect(curStimuli[stimID], $("input[name=radio-resp" + stimID + "]:checked").val());
        }
        if (pageNum == lastPage - 1) { // TODO: -1 for indexing; make indexing consistent
          teardownHTMLPage();
          checkPassFail();
          alert("done with headphone check");
        }
        else if (canContinue) { // Advance the page
          teardownHTMLPage();
          pageNum++;
          HeadphoneCheck.renderHTMLPage(pageNum);
        }
        else { // need responses, don"t advance page, show warnings
          renderResponseWarnings();
        }
      }
    }).appendTo($("#container-exp"));
  };

  HeadphoneCheck.renderCalibration = function() {
    $("<div/>", {
      id: "instruct",
      class: "warning",
      text: "You must be wearing headphones to do this HIT!"
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "First, set your computer volume to about 25% of maximum."
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Level Calibration"
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Press the button, then turn up the volume on your computer until the calibration noise is at a loud but comfortable level."
    }).appendTo($("#container-exp"));

    $("<div/>", {
      id: "calibration",
      class: "calibrationDiv",
      text: "Play the calibration sound as many times as you like."
    }).appendTo($("#container-exp"));

    //add in the audio source
    $("<audio/>", {
        id: "audioCalibration",
        type: "audio/mpeg", // TODO: Factor this out, should be user defined
        // type: parseAudioType(stimID),
        src: calibration.stimFile
      }).appendTo($("#calibration"));

    //add in the button for playing the sound
    $("<button/>", {
      id: "bCalibration" ,
      disabled: false,
      click: function () {
        if (!st_isPlaying){
          playCalibration("audioCalibration");
        }
        $("#continueCalibration").prop('disabled',false);
      },
      text: "Play"
    }).appendTo($("#calibration"));

    $("<div/>", {
      class: "warning",
      html: "Press <b>Continue</b> when level calibration is complete."
    }).appendTo($("#container-exp"));

    // Add button to continue
    $("<button/>", {
      id: "continueCalibration",
      class: "warning",
      disabled: true,
      // type: "button",
      text: "Continue",
      click: function () {
        teardownHTMLPage();
        HeadphoneCheck.renderHTMLPage(0);
      }
    }).appendTo($("#container-exp"));
};


}( window.HeadphoneCheck = window.HeadphoneCheck || {}, jQuery));

$(document).ready(function() {
  jsonpath = "headphone_check_stim.json";
  HeadphoneCheck.loadExamples(jsonpath);
  var pageNum = 0;
  // var continueVal = HeadphoneCheck.renderCalibration();
  var continueVal = HeadphoneCheck.renderHTMLPage(pageNum);
  if (continueVal) {
    alert("continuing on!");
  }
});

