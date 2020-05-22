//savageDice teplate path
let SavageRollAppTemplate = "modules/savage-rolls/templates/SavageRollApp.html";
let SavageRollDiceTemplate = "modules/savage-rolls//templates/SavageDice.html";

//create savagerolls app    
let SavageRollApp = new Application({
    baseApplication: "TestApp",
    width: "auto",
    height: "auto",
    top: "auto",
    left: "auto",
    popOut: true,
    minimizable: true,
    resizable: true,
    id: "savage-roll-window",
    classes: ["savage-roll-window"],
    title: "Savage Rolls",
    template: SavageRollAppTemplate,
    scrollY: []
});

Hooks.once("init", function () {
    console.log(`SavageRolls | Initializing SavageRolls`);
});

//create new control button
Hooks.on('renderSceneControls', function (controls, html) {
    let SavageRollControlTemplate = $(
        `
        <li class="scene-control" data-control="savage-rolls" data-canvas-layer="SavageRollsLayer" title="Savage Rolls"  id="savage-control">
            <i class="fas fa-dice"></i>
        </li>

        `
    );

    html.append(SavageRollControlTemplate);
});

//render SavageRollApp
$(document).on('click', '#savage-control', async function () {
    console.log(SavageRollApp);
    if (SavageRollApp.rendered) {
        SavageRollApp.close();
    } else {
        SavageRollApp.render(true);
    }
});

// roll dice
$(document).on('click', '.savage-button', async function (event) {

    // declare variables
    let content = null;
    let formula = null;
    let result = null;
    let resultType = null;
    let rollMode = null;
    let SavageRoll = new Roll("1d4");

    // get variables
    let rollWild = $(document).find('#savage-wild').is(":checked");
    let rollExtra = $(document).find('#savage-extra').is(":checked");
    let mod = $(document).find('#savage-mod').val();
    let tn = $(document).find('#savage-tn').val();
    let diceType = $(this).val();

    // evaluate roll type
    if (rollWild == true) {
        //roll formula
        SavageRoll.formula = "{1d" + diceType + "x=,1d6x=}kh+" + mod;
        // roll roll
        SavageRoll.roll();

        // evaluate roll
        if (SavageRoll.dice[0].rolls[0].roll == 1 && SavageRoll.dice[1].rolls[0].roll == 1) {
            result = "Critical Miss!";
            resultType = false;
        } else {
            if (SavageRoll.total >= tn) {
                result = "Hit | " + Math.floor((SavageRoll.total - tn) / 4) + " Raises";
                resultType = true;
            } else {
                result = "Miss";
                resultType = false;
            }
        }

        // create chat message
        content = await renderTemplate(SavageRollDiceTemplate, {
            formula: SavageRoll.formula,
            total: SavageRoll.total,
            tooltip: await SavageRoll.getTooltip(),
            result: result,
            resultType: resultType
        });


    } else if (rollExtra == true) {
        //roll formula
        SavageRoll.formula = "{1d" + diceType + "x=,1d6}+" + mod;
        // roll roll
        SavageRoll.roll();

        // evaluate roll
        if (SavageRoll.dice[0].rolls[0].roll == 1 && SavageRoll.dice[1].rolls[0].roll == 1) {
            result = "Critical Miss!";
            resultType = false;
        } else {
            if (SavageRoll.dice[0].total + Number(mod) >= tn) {
                result = "Hit | " + Math.floor((SavageRoll.dice[0].total + Number(mod) - tn) / 4) + " Raises";
                resultType = true;
            } else {
                result = "Miss";
                resultType = false;
            }
        }

        // create chat message
        content = await renderTemplate(SavageRollDiceTemplate, {
            formula: SavageRoll.formula,
            total: (SavageRoll.dice[0].total + Number(mod)),
            tooltip: await SavageRoll.getTooltip(),
            result: result,
            resultType: resultType
        });
    }

    // create chatData
    let chatData = {
        user: game.user._id,
        content: content,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        sound: CONFIG.sounds.dice
    };
    chatData.roll = JSON.stringify(SavageRoll);

    // Handle different roll modes
    rollMode = rollMode || game.settings.get("core", "rollMode");
    switch (rollMode) {
        case "gmroll":
            chatData["whisper"] = game.users.entities.filter(u => u.isGM).map(u => u._id);
            break;
        case "selfroll":
            chatData["whisper"] = [game.user._id];
            break;
        case "blindroll":
            chatData["whisper"] = game.users.entities.filter(u => u.isGM).map(u => u._id);
            chatData["blind"] = true;
    }

    // Output the rolls to chat
    ChatMessage.create(chatData);

});
