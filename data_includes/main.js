PennController.ResetPrefix(null); // Shorten command names (keep this line here))

// DebugOff()   // Uncomment this line only when you are 100% done designing your experiment

const voucher = b64_md5((Date.now() + Math.random()).toString()); // Voucher code generator

// Optionally Inject a question into a trial
const askQuestion = (successCallback, failureCallback, waitTime) => (row) => (row.QUESTION=="1" ? [
  newText( "answer_correct" , row.CORRECT ),
  newText( "answer_wrong" , row.WRONG ),

  newCanvas("Canvas", 600, 100)
    .center()
    .add(   0 ,  0,  newText("Wer oder was wurde im Satz erwähnt?"))
    .add(   0 , 50 , newText("1 =") )
    .add( 300 , 50 , newText("2 =") )
    .add(  40 , 50 , getText("answer_correct") )
    .add( 340 , 50 , getText("answer_wrong") )
    .print()
  ,
  // Shuffle the position of the answers. Answer keys are 1 for left and 2 for right
  newSelector("answer")
    .add( getText("answer_correct") , getText("answer_wrong") )
    .shuffle()
    .keys("1","2")
    .log()
    .print()
    .once()
    .wait()
    .test.selected( "answer_correct" )
    .success.apply(null, successCallback().concat(
        [getText("answer_correct").css("border-bottom", "5px solid lightCoral")]
    ))
    .failure.apply(null, failureCallback().concat(
        [getText("answer_wrong").css("border-bottom", "5px solid lightCoral")]
    )),

  // Wait for feedback and to display which option was selected
  newTimer("timer_wait2", waitTime)
    .start()
    .wait()
] : []);

const askExerciseQuestion = askQuestion(
  () => [newText("<b>Richtig!</b>").color("LightGreen").center().print()],
  () => [newText("<b>Leider falsch!</b>").color("Crimson").center().print()],
  1000
);

const askTrialQuestion = askQuestion(
  () => [getVar("ACCURACY").set(v=>[...v,true])],
  () => [
    getVar("ACCURACY").set(v=>[...v,false]),
    newText("<b>Leider falsch!</b>")
      .color("Crimson")
      .center()
      .print(),
    // need to repeat the css code, unfortunately, because of the time that follows
    getText("answer_wrong").css("border-bottom", "5px solid lightCoral"),
    // Penalty for the wrong answer is waiting 1000 ms before continuing
    newTimer("timer_wait", 1000)
      .start()
      .wait()
  ],
  300
);

// display a primer that can be clicked away by pressing space bar
const newPrimer = () => [
  newText('primer','*')
    .css("font-size", "30pt")
    .css("margin-top", "8px")
    .center()
    .print(),
  newKey(" ").wait(),
  getText('primer').remove(),
];

Header(
    // Declare global variables to store the participant's ID and demographic information
    newVar("ID").global(),
    newVar("GERMAN").global(),
    newVar("LAND").global(),
    newVar("NATIVE").global(),
    newVar("AGE").global(),
    newVar("GENDER").global(),
    newVar("HAND").global(),
    newVar("ACCURACY", []).global()
)
 // Add the particimant info to all trials' results lines
.log( "id"     , getVar("ID") )
.log( "german" , getVar("GERMAN") )
.log( "land"   , getVar("LAND") )
.log( "native" , getVar("NATIVE") )
.log( "age"    , getVar("AGE") )
.log( "gender" , getVar("GENDER") )
.log( "hand"   , getVar("HAND") )
.log( "code"   , voucher );

// Sequence of events: consent to ethics statement required to start the experiment, participant information, instructions, exercise, transition screen, main experiment, result logging, and end screen.
 Sequence("ethics", "setcounter", "participants", "instructions", randomize("exercise"), "start_experiment", rshuffle("experiment-filler", "experiment-item"), SendResults(), "end")

// Ethics agreement: participants must agree before continuing
newTrial("ethics",
    newHtml("ethics_explanation", "ethics.html")
        .cssContainer({"margin":"1em"})
        .print()
    ,
newHtml("form",`<div dir="RTL" style="text-align: justify; direction: rtl; unicode-bidi: embed;"><span lang="HE" style="font-size: 11.0pt; font-family: 'David',sans-serif;"><input id="consent" name="consent" type="checkbox" /><span lang="HE" style="font-size: 11.0pt; font-family: 'David',sans-serif;">אני בן/בת 18 לפחות ומסכים/ה לקחת חלק במחקר הנוכחי. קראתי והבנתי את המידע לעיל. השתתפותי במחקר הינה בהתנדבות ואני מודע/ת לכך שיש לי אפשרות לפרוש ממחקר זה בכל עת. אני נותן/ת את הסמכתי לכך שנתוני המחקר ייקלטו ויעשה בהם שימוש באופן אנונימי כחלק ממחקר זה.</span><label for="consent">.</label></span></div>`)
        .cssContainer({"direction": "rtl", "margin":"1em"})
        .print()
    ,
    newFunction( () => $("#consent").change( e=>{
        if (e.target.checked) getButton("go_to_info").enable()._runPromises();
        else getButton("go_to_info").disable()._runPromises();
    }) ).call() 
    ,
    newButton("go_to_info",'<div style="font-family: David;"><strong>התחל ניסוי</strong></div>')
        .cssContainer({"direction": "rtl", "margin-top":"1em"})
        .disable()
        .print()
        .wait()
);

// Start the next list as soon as the participant agrees to the ethics statement
// This is different from PCIbex's normal behavior, which is to move to the next list once 
// the experiment is completed. In my experiment, multiple participants are likely to start 
// the experiment at the same time, leading to a disproportionate assignment of participants
// to lists.
SetCounter("setcounter");

// Participant information: questions appear as soon as information is input
newTrial("participants",
    defaultText
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    newText("participant_info_header", '<h1 dir="rtl" style="font-family: David; text-align: center;">שאלון פרטים אישיים</h1>').center()
    ,
    newText("participant_info_sub_header", '<div dir="rtl" style="font-family: David;">אנא ענה על השאלות הבאות. בשאלות שיש לצידן תשובות אפשריות, אנא סמן את התשובה המיטיבה לתאר את מצבך. בשאלות שאין לצידן אפשרויות תשובה, אנא השלם בהתאם.</div>')
    ,
    newText('<div dir="rtl" style="font-family: David;">האם עברית היא שפת האם שלך?</div>')
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newScale("input_hebrew", '<div dir="rtl" style="font-family: David;">כן</div>', '<div dir="rtl" style="font-family: David;">לא</div>')
        .radio()
        .log()
        .labelsPosition("right")
        .cssContainer({"direction": "rtl"})
        .callback( getText("errorage").remove(), getText("errorHebrew").remove(), getText("errorGender").remove(), getText("errorNative").remove() )
        .print()
    ,
    newText('')
    ,
    // Other native languages
    newText('<div dir="rtl" style="font-family: David;">האם את/ה דובר/ת שפות נוספות ברמת שפת אם?</div>')
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newScale("input_native", '<div dir="rtl" style="font-family: David;">כן</div>', '<div dir="rtl" style="font-family: David;">לא</div>')
        .radio()
        .labelsPosition("right")
        .log()
        .cssContainer({"direction": "rtl"})
         .callback( getText("errorage").remove(), getText("errorHebrew").remove(), getText("errorGender").remove(), getText("errorNative").remove() )
        .print()
    ,
    newText('')
    ,
    // Age
    newText('<div dir="rtl" style="font-family: David;">מהו גילך?</div>')
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newTextInput("input_age")
        .length(2)
        .log()
        .cssContainer({"direction": "rtl"})
        .print()
    ,
     newText('')
    ,
    // Gender
    newText('<div dir="rtl" style="font-family: David;">מה המין שלך?</div>')
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newScale("input_gender",   '<div dir="rtl" style="font-family: David;">נקבה</div>', '<div dir="rtl" style="font-family: David;">זכר</div>', '<div dir="rtl" style="font-family: David;">אחר</div>')
        .radio()
        .log()
        .cssContainer({"direction": "rtl"})
        .labelsPosition("right")
        .callback( getText("errorage").remove(), getText("errorHebrew").remove(), getText("errorGender").remove(), getText("errorNative").remove() )
        .print()
    ,
      // Clear error messages if the participant changes the input
    newKey("just for callback", "") 
        .callback( getText("errorage").remove(), getText("errorHebrew").remove(), getText("errorGender").remove(), getText("errorNative").remove() )
    ,
    // Formatting text for error messages
    defaultText.color("Crimson").print()
    ,
    // Continue. Only validate a click when ID and age information is input properly
    newButton("weiter", "Weiter zur Instruktion")
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
        // Check for participant ID and age input
        .wait(
             newFunction('dummy', ()=>true).test.is(true)
             // Age
            .and( getTextInput("input_age").test.text(/^\d+$/)
                .failure( newText('errorage', '<div dir="rtl" style="font-family: David;">אנא כתוב/כתבי את גילך שנית.</div>'), 
                          getTextInput("input_age").text("")))
             .and( getScale("input_hebrew").test.selected()
                .failure( newText('errorHebrew', '<div dir="rtl" style="font-family: David;">אנא סמן/י האם עברית שפת אמך.</div>')))  
             .and( getScale("input_gender").test.selected()
                .failure( newText('errorGender', '<div dir="rtl" style="font-family: David;">אנא סמן/י את מינך.</div>'))) 
             .and( getScale("input_native").test.selected()
                .failure( newText('errorNative', '<div dir="rtl" style="font-family: David;">אנא סמן/י האם אתה דובר/ת שפות אם נוספות.</div>'))) 
        )
    ,
    // Store the texts from inputs into the Var elements
    getVar("HEBREW") .set( getScale("input_hebrew") ),
    getVar("NATIVE") .set( getScale("input_native") ),
    getVar("AGE")    .set( getTextInput("input_age") ),
    getVar("GENDER") .set( getScale("input_gender") )
);

// Instructions
newTrial("instructions",
    newHtml("instructions_text", "instructions.html")
        .cssContainer({"margin":"1em"})
        .print()
        ,
    newButton("go_to_exercise", "Übung starten")
        .cssContainer({"margin":"1em"})
        .print()
        .wait()
);

// Exercise
Template("exercise.csv", row =>
  newTrial("exercise",
           newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("SelfPacedReadingParadigmSentence", {s : row.SENTENCE, splitRegex: /\*/})
           .center()
           .print()
           .log()
           .wait()
           .remove(),
           askExerciseQuestion(row))
    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
);

// Start experiment
newTrial( "start_experiment" ,
    newText("<h2>Jetzt beginnt der Hauptteil der Studie.</h2><div>Sie kriegen Feedback nur bei falscher Antwort.</div>")
        .print()
    ,
    newButton("go_to_experiment", "Experiment starten")
        .print()
        .wait()
);

// Experimental trial
Template("experiment.csv", row =>
    newTrial( "experiment-"+row.TYPE,
              newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
          // newController("SelfPacedReadingParadigmSentence", {s : row.SENTENCE, splitRegex: /\*/})
           newController("DashedSentence", {s : row.SENTENCE, mode: "speeded acceptability"})
           .center()
           .print()
           .log()
           .wait()
           .remove(),
           askTrialQuestion(row))
    .log( "list"      , row.LIST)
    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
);

// Final screen: explanation of the goal
newTrial("end",
    newText("<div class='fancy'><h2>Vielen Dank für die Teilnahme an unserer Studie!</h2></div><div>Um Ihre Vergütung zu bekommen, schicken Sie bitte diesen persönlichen Code an die Versuchsleiterin: <div class='fancy'><em>".concat(voucher, "</em></div></div>"))
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,

    newVar("computedAccuracy").set(getVar("ACCURACY")).set(v=>Math.round(v.filter(a=>a===true).length/v.length*100)),
    newText("accuracy").text(getVar("computedAccuracy"))
    ,
    newText("So viel Prozent der Fragen haben Sie richtig beantwortet: ")
        .after(getText("accuracy"))
        .print()
    ,
    newHtml("explain", "end.html")
        .print()
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false);
