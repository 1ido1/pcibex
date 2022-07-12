PennController.ResetPrefix(null); // Shorten command names (keep this line here))

// DebugOff()   // Uncomment this line only when you are 100% done designing your experiment

const voucher = b64_md5((Date.now() + Math.random()).toString()); // Voucher code generator

formmater = (text) => '<div dir="rtl" style="font-family: David; text-align: right;">' + text + '</div>';

// Optionally Inject a question into a trial
const askQuestion = (successCallback, failureCallback, waitTime) => (row) => (true ? [
  newText( "answer_correct" , formmater(row.CORRECT)),
  newText( "answer_wrong" , formmater(row.WRONG)),

  newCanvas("Canvas", 700, 100)
    .add(  340 ,  0,  newText(formmater('לפי דעתך האם המשפט הוא משפט טוב או לא טוב?')).cssContainer({"direction": "rtl"}).print())
    .add(  600 , 50 , newText(formmater('1 = ')).cssContainer({"direction": "rtl"}).print()) 
    .add( 340 , 50 , newText(formmater('2 = ')).cssContainer({"direction": "rtl"}).print()) 
    .add(  560 , 50 , getText("answer_correct").cssContainer({"direction": "rtl"}).print())
    .add( 300 , 50 , getText("answer_wrong").cssContainer({"direction": "rtl"}).print()) 
    .cssContainer({"direction": "rtl"})
    .right()
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
        [getText("answer_correct").css("border-bottom", "5px solid black")]
    ))
    .failure.apply(null, failureCallback().concat(
        [getText("answer_wrong").css("border-bottom", "5px solid black")]
    )),

  // Wait for feedback and to display which option was selected
  newTimer("timer_wait2", waitTime)
    .start()
    .wait()
] : []);

const askExerciseQuestion = askQuestion(
  () => [],
  () => [],
  1000
);

const askTrialQuestion = askQuestion(
  () => [getVar("ACCURACY").set(v=>[...v,true])],
  () => [getVar("ACCURACY").set(v=>[...v,false])],
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
    newVar("NATIVE").global(),
    newVar("AGE").global(),
    newVar("GENDER").global(),
    newVar("ACCURACY", []).global()
)
 // Add the particimant info to all trials' results lines
.log( "id"     , getVar("ID") )
.log( "native" , getVar("NATIVE") )
.log( "age"    , getVar("AGE") )
.log( "gender" , getVar("GENDER") )
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
    newButton("go_to_info",formmater('<strong>התחל ניסוי</strong>'))
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
    newText("participant_info_sub_header", formmater('אנא ענה על השאלות הבאות. בשאלות שיש לצידן תשובות אפשריות, אנא סמן את התשובה המיטיבה לתאר את מצבך. בשאלות שאין לצידן אפשרויות תשובה, אנא השלם בהתאם.'))
    ,
    newText(formmater('האם עברית היא שפת האם שלך?'))
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newScale("input_hebrew", formmater('כן'), formmater('לא'))
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
    newText(formmater('האם את/ה דובר/ת שפות נוספות ברמת שפת אם?'))
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newScale("input_native", formmater('כן'), formmater('לא'))
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
    newText(formmater('מהו גילך?'))
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
    newText(formmater('מה המין שלך?'))
        .cssContainer({"direction": "rtl"})
        .print()
    ,
    newScale("input_gender",   formmater('נקבה'), formmater('זכר'), formmater('אחר'))
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
    newButton("next", formmater('<strong>עבור להוראות הניסוי </strong>'))
        .cssContainer({"direction": "rtl", "margin-top":"1em"})
        .print()
        // Check for participant ID and age input
        .wait(
             newFunction('dummy', ()=>true).test.is(true)
             // Age
            .and( getTextInput("input_age").test.text(/^\d+$/)
                .failure( newText('errorage', formmater('אנא כתוב/כתבי את גילך שנית.')).cssContainer({"direction": "rtl"}).print(), 
                          getTextInput("input_age").text("")))
             .and( getScale("input_hebrew").test.selected()
                .failure( newText('errorHebrew', formmater('אנא סמן/י האם עברית שפת אמך.')).cssContainer({"direction": "rtl"}).print()))
             .and( getScale("input_gender").test.selected()
                .failure( newText('errorGender', formmater('אנא סמן/י את מינך.')).cssContainer({"direction": "rtl"}).print()))
             .and( getScale("input_native").test.selected()
                .failure( newText('errorNative', formmater('אנא סמן/י האם אתה דובר/ת שפות אם נוספות.')).cssContainer({"direction": "rtl"}).print()))
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
    newButton("go_to_exercise", formmater('<strong>התחל אימון</strong>'))
        .cssContainer({"direction": "rtl", "margin-top":"1em"})
        .print()
        .wait()
);
// Exercise
Template("exercise.csv", row =>
  newTrial("exercise",
           newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("DashedSentence", {s : row.SENTENCE, mode: "speeded acceptability", wordPauseTime: 50, wordTime: 375})
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
    newText('<h2 dir="rtl" style="font-family: David; text-align: center;">עכשיו נתחיל את החלק העיקרי של הניסוי</h2>')
        .cssContainer({"direction": "rtl"})
        .center()
        .print()
    ,
    newButton("go_to_experiment", formmater('<strong>התחל את הניסוי</strong>'))
        .cssContainer({"direction": "rtl"})
        .print()
        .wait()
);

// Experimental trial
Template("experiment.csv", row =>
    newTrial( "experiment-"+row.TYPE,
              newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("DashedSentence", {s : row.SENTENCE, mode: "speeded acceptability", wordPauseTime: 50, wordTime: 375}) 
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
    newText("<div class='fancy';center;><h2>תודה על השתתפותך בניסוי!</h2></div>").center()
        .cssContainer({"direction":"rtl", "margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    newVar("computedAccuracy").set(getVar("ACCURACY")).set(v=>Math.round(v.filter(a=>a===true).length/v.length*100)),
    newText("accuracy").text(getVar("computedAccuracy"))
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false);
