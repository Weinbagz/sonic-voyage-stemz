let images = {}; // Store images here
let currentImages = {}; // Store currently showing images here
let bgImage; // 
let overlayImage;
let alpha = 0; // This variable will control the opacity during the fade effect
let fading = false; // This variable will indicate if a fade effect is happening
let players = {};
let effects = {};
let categories = [
  "Bass",
  "Drums",
  "Lead",
  "Chords",
  "Accent",
  "EFX",
  "Breakdown",
];
let effectsList = ["none", "delay", "reverb", "distortion", "vibrato"];
let categoryFileCounts = {
  Bass: 5,
  Drums: 5,
  Lead: 5,
  Chords: 6,
  Accent: 6,
  EFX: 9,
  Breakdown: 8,
};
let categoryDisplayNames = {
  Bass: [
    "Bridge Plucker",
    "Subpumper",
    "Fat Bottom",
    "Bass Pusher",
    "Arpeggiator",
  ],
  Drums: ["Tambist", "8bit Drummer", "The Slomo", "Heartbeat", "House Drummer"],
  Lead: ["The Traveler", "The Visitor", "Whistler", "Sonic Voyage", "The Bull"],
  Chords: [
    "Pump It Up",
    "The Vibist",
    "The Cheesist",
    "Mr Smooth",
    "Feedback Loop",
    "The Rhodes Trip",
  ],
  Accent: [
    "Synth Poker",
    "Airhead",
    "Synth Flight",
    "The Dubber",
    "The Skank",
    "The Jumper",
  ],
  EFX: [
    "The Polygraph",
    "Emergency",
    "Telegrapher",
    "The Arcade",
    "The Radio",
    "The Airhorn",
    "Transmitter",
    "Checked Out",
    "The Cyborg",
  ],
  Breakdown: [
    "The Gospel",
    "Ascender",
    "The Lab",
    "Shredders",
    "The Shepherd",
    "70s Vibez",
    "The Stairway",
    "The Comic",
  ],
};

let volumeSliders = {};
let selects = {};
let effectsSelects = {};
let wetDrySliders = {};
let soloButtons = {}; // Added soloButtons object
let muteButtons = {}; // Added muteButtons object
let soloStates = {}; // Added soloStates object to store the solo state of each category
let muteStates = {}; // Added muteStates object to store the mute state of each category
let currentPlayers = {};
let currentEffects = {};
let limiter = new Tone.Limiter(-0.5).toDestination();

let allLoaded = false;

let loadCount = 0;
let totalFiles = 0;
let loadingIndicator;

for (let category in categoryFileCounts) {
  totalFiles += categoryFileCounts[category];
}

function preload() {
  loadingIndicator = createElement("p", "Loading...");
  
  bgImage = loadImage('https://storage.googleapis.com/playerz_cardz/sonic_voyage_img/zzbackground.png');


  categories.forEach((category) => {
    players[category] = [];
    effects[category] = {};

    effectsList.forEach((effect) => {
      switch (effect) {
        case "delay":
          effects[category][effect] = new Tone.PingPongDelay(0.13);
          break;
        case "reverb":
          effects[category][effect] = new Tone.Reverb(6);
          break;
        case "distortion":
          effects[category][effect] = new Tone.Distortion();
          break;
        case "tremolo":
        case "vibrato":
          effects[category][effect] = new Tone.Vibrato({
            frequency: 5.0, // Frequency of the effect in Hz
            depth: 0.3, // Depth of the effect from 0 to 1
          });
          break;
        default:
          break;
      }
    });

   // Loading images
images[category] = [];
for (let i = 0; i < categoryFileCounts[category]; i++) {
  let img = loadImage(
    "https://storage.googleapis.com/playerz_cardz/sonic_voyage_img/" +
      category +
      i +
      ".png",
    () => {
      console.log(category + i + ".png has loaded.");
    },
    (e) => {
      console.log("Error loading " + category + i + ".png");
      console.error(e);
    }
  );
  images[category].push(img);
}

// Set the first image as the current image for each category
currentImages[category] = images[category][0];

    // Loading audio
    for (let i = 0; i < categoryFileCounts[category]; i++) {
      let player = new Tone.Player({
        url:
          "https://storage.googleapis.com/playerz_cardz/sonic_voyage/" +
          category +
          i +
          ".mp3" + "?authuser=1",
        onload: () => {
          console.log(category + i + ".mp3 has loaded.");
          player.sync().start(0);
          if (i === 0) {
            currentPlayers[category] = player;
            player.mute = false;
          } else {
            player.mute = true;
          }
          loadCount++;
          if (loadCount === totalFiles) {
            loadingIndicator.remove();
            allLoaded = true;
            console.log("All assets are loaded.");
            setupInterface();
          }
        },
        loop: true,
        onerror: (e) => {
          console.log("Error loading " + category + i + ".mp3");
          console.error(e);
        },
      }).connect(limiter);
      players[category].push(player);
    }
  });
}

function setupInterface() {
  let row1 = createElement("div");
  row1.addClass("row");
  let row2 = createElement("div");
  row2.addClass("row");
  let row3 = createElement("div");
  row3.addClass("row");
  let row4 = createElement("div");
  row4.addClass("row");

  const rows = [row1, row2, row3, row4];

  categories.forEach((category, i) => {
    let categoryContainer = createElement("div");
    categoryContainer.addClass("category");

    const rowIndex =
      window.innerWidth > 768 ? Math.floor(i / 3) : Math.floor(i / 2);
    categoryContainer.parent(rows[rowIndex]);

    let categoryLabel = createElement("div", category);
    categoryLabel.addClass("label");
    categoryLabel.parent(categoryContainer);

    let selectContainer = createElement("div");
    selectContainer.addClass("select");
    selectContainer.parent(categoryContainer);

    let select = createSelect();
    select.parent(selectContainer);
    select.style("background", "#FFFFFF");
    select.style("color", "#02001C");
    select.style("padding", "5px");
    select.style("border-radius", "4px");

    for (let j = 0; j < categoryFileCounts[category]; j++) {
      select.option(categoryDisplayNames[category][j]);
    }

    selects[category] = select;
    select.changed(() => {
    let displayName = selects[category].value();
    let index = categoryDisplayNames[category].indexOf(displayName);
    let player = players[category][index];
    let img = images[category][index];

    if (currentPlayers[category]) {
      currentPlayers[category].mute = true;
    }

    player.mute = false;
    player.volume.value = volumeSliders[category].value();
    currentPlayers[category] = player;

    // Initiating the fade effect
    fading = true;
    alpha = 0; // Reset alpha to 0 when starting the fade effect
    currentImages[category] = img; // Set the new image, which will gradually appear
  });


    // Select the first item by default
    if (selects[category].value() === categoryDisplayNames[category][0]) {
      currentImages[category] = images[category][0];
      currentPlayers[category] = players[category][0];
      currentPlayers[category].mute = false;
    }

    let volumeContainer = createElement("div");
    volumeContainer.addClass("volume");
    volumeContainer.parent(categoryContainer);

    let volumeLabel = createElement("p", "Volume");
    volumeLabel.parent(volumeContainer);
    volumeLabel.style("color", "#f708f7");
    volumeLabel.style("font-size", "16px");

    let volumeSlider = createSlider(-60, 0, 0);
    volumeSlider.parent(volumeContainer);
    volumeSlider.style("width", "100%");
    volumeSlider.style("background-color", "#000");
    volumeSlider.style("color", "#fff");
    volumeSliders[category] = volumeSlider;
    volumeSlider.input(() => {
      let volumeValue = volumeSliders[category].value();
      if (currentPlayers[category]) {
        currentPlayers[category].volume.value = volumeValue;
      }
    });

    let effectsContainer = createElement("div");
    effectsContainer.addClass("effects");
    effectsContainer.parent(categoryContainer);

    let effectsLabel = createElement("p", "Effects");
    effectsLabel.addClass("effects");
    effectsLabel.parent(effectsContainer);

    let effectsSelect = createSelect();
    effectsSelect.parent(effectsContainer);
    effectsSelect.style("background", "#FFFFFF");
    effectsSelect.style("color", "#02001C");
    effectsSelect.style("padding", "5px");
    effectsSelect.style("border-radius", "4px");

    effectsList.forEach((effect) => {
      effectsSelect.option(effect);
    });

    effectsSelects[category] = effectsSelect;
    effectsSelect.changed(() => {
      let effectName = effectsSelects[category].value();
      let effect = effects[category][effectName];

      if (currentEffects[category]) {
        currentPlayers[category].disconnect(currentEffects[category]);
        currentEffects[category].disconnect(limiter); // disconnect old effect from limiter
      }

      if (effectName !== "none") {
        currentPlayers[category].connect(effect);
        effect.wet.value = wetDrySliders[category].value();
        effect.connect(limiter); // connect new effect to limiter
        currentEffects[category] = effect;
      }
    });

    let wetDryContainer = createElement("div");
    wetDryContainer.addClass("wetDry");
    wetDryContainer.parent(categoryContainer);

    let wetDrySlider = createSlider(0, 1, 0, 0.01); // changed third argument from 0.5 to 0
    wetDrySlider.addClass("wetSlide");
    wetDrySlider.parent(wetDryContainer);
    wetDrySlider.style("width", "100%");
    wetDrySlider.style("background-color", "#000");
    wetDrySlider.style("color", "#fff");
    wetDrySliders[category] = wetDrySlider;
    wetDrySlider.input(() => {
      let wetDryValue = wetDrySliders[category].value();
      if (currentEffects[category]) {
        currentEffects[category].wet.value = wetDryValue;
      }
    });

    let soloContainer = createElement("div");
    soloContainer.addClass("solo");
    soloContainer.parent(categoryContainer);

    let soloButton = createButton("Solo");
    soloButton.addClass("soloButton");
    soloButton.parent(soloContainer);

    soloButtons[category] = soloButton; // Store the solo button in the soloButtons object
    soloStates[category] = false; // Initialize the solo state as false

    soloButton.mousePressed(() => {
      soloStates[category] = !soloStates[category]; // Toggle the solo state

      if (soloStates[category]) {
        // Solo the category
        for (let cat in currentPlayers) {
          if (cat === category) {
            currentPlayers[cat].mute = false;
            soloButtons[category].html("Unsolo"); // Update button text to "Unsolo"
          } else {
            currentPlayers[cat].mute = true;
            soloButtons[cat].html("Solo"); // Reset other solo buttons to "Solo"
          }
        }
      } else {
        // Un-solo the category
        for (let cat in currentPlayers) {
          currentPlayers[cat].mute = false;
          soloButtons[cat].html("Solo"); // Reset all solo buttons to "Solo"
        }
      }
    });

    let muteContainer = createElement("div");
    muteContainer.addClass("mute");
    muteContainer.parent(categoryContainer);

    let muteButton = createButton("Mute");
    muteButton.addClass("muteButton");
    muteButton.parent(muteContainer);

    muteButtons[category] = muteButton; // Store the mute button in the muteButtons object
    muteStates[category] = false; // Initialize the mute state as false

    muteButton.mousePressed(() => {
      muteStates[category] = !muteStates[category]; // Toggle the mute state

      if (muteStates[category]) {
        currentPlayers[category].mute = true;
        muteButtons[category].html("Unmute"); // Update button text to "Unmute"
      } else {
        currentPlayers[category].mute = false;
        muteButtons[category].html("Mute"); // Update button text to "Mute"
      }
    });
  });
  
  let startAudioButton = createButton("Start Audio");
startAudioButton.addClass("startAudioButton");
startAudioButton.parent(document.body); // Append the button directly to the body

// Event listener to start audio
startAudioButton.mousePressed(async () => {
  if (Tone.context.state !== "running") {
    await Tone.start();
  }
  // Unmute the current player for each category
  for (let category in currentPlayers) {
    currentPlayers[category].mute = false;
  }
  Tone.Transport.start();
});


 let togglePlaybackButton = createButton("Stop Playback");
togglePlaybackButton.addClass("togglePlaybackButton");

togglePlaybackButton.mousePressed(async () => {
  if (Tone.Transport.state === "started") {
    Tone.Transport.stop();
  } else {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    Tone.Transport.start();
  }
});

// Append the button directly to the body
togglePlaybackButton.parent(document.body);

  // Appending rows directly to the body
  rows.forEach((row) => row.parent(document.body));

 
}

window.addEventListener("resize", () => {
  clearInterface();
  setupInterface();
});


async function startAudio() {
  if (Tone.context.state !== "running") {
    await Tone.start();
  }

  // Unmute the current player for each category
  for (let category in currentPlayers) {
    currentPlayers[category].mute = false;
  }

  Tone.Transport.start();
  
  let unmuteButton = createButton("Unmute");
  unmuteButton.addClass("unmuteButton");
  unmuteButton.parent(document.body); // Append the button directly to the body

  // Event listener to unmute
  unmuteButton.mousePressed(async () => {
    if (Tone.context.state !== "running") {
      await Tone.context.resume();
    }
  });
}

async function startAudio() {
  if (Tone.context.state !== "running") {
    // Note that we don't await Tone.start() here. It needs to be started in response to user interaction.
    console.log("Audio context is not running. Please unmute.");
  } else {
    // Unmute the current player for each category
    for (let category in currentPlayers) {
      currentPlayers[category].mute = false;
    }
    Tone.Transport.start();
  }
}


// function clearInterface() {
//   for (let category in currentPlayers) {
//     currentPlayers[category].mute = true;
//   }

//   document
//     .querySelectorAll(
//       ".row, .category, .label, .select, .volume, .effects, .wetDry, .solo, .mute, p, button"
//     )
//     .forEach((element) => element.remove());
// }

function setup() {
  let cnv = createCanvas(300, 300); // specify your canvas size
  cnv.parent("my-sketch"); // set a parent for the canvas (optional)
  background(200); // set a gray background so we can see the canvas

  
  // Hide images by default
  for (let category in images) {
    currentImages[category] = null;
  }
}



function draw() {
  clear(); // Clear the canvas

  // Render the background image to cover the entire canvas
  image(bgImage, 0, 0, 300, 300); 

  // Iterate through all categories and display their current image
  for (let category in currentImages) {
    let img = currentImages[category];
    if (img) {
      // Display the image to cover the entire canvas
      image(img, 0, 0, 300, 300); 
    }
  }
  
}

