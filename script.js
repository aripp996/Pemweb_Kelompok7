function navigateSPA(target) {
    const screenMenu = document.getElementById('screen-menu');
    const screenGame = document.getElementById('screen-game');

    if (target === 'game') {
        screenMenu.classList.add('hidden');
        screenGame.classList.remove('hidden');
        screenGame.classList.add('flex');
        loadLevel(0); // Mulai game selalu dari Level 1 saat start ditekan
    } else if (target === 'menu') {
        screenGame.classList.add('hidden');
        screenGame.classList.remove('flex');
        screenMenu.classList.remove('hidden');
    }
}

// --- 2. LOGIKA MENU PENGATURAN ---
function toggleSettingPage(showSetting) {
    if (showSetting) {
        document.getElementById("menuPage").classList.add("hidden");
        document.getElementById("settingPage").classList.remove("hidden");
    } else {
        document.getElementById("settingPage").classList.add("hidden");
        document.getElementById("menuPage").classList.remove("hidden");
    }
}

function saveLanguage() {
    const language = document.querySelector('input[name="language"]:checked').value;
    localStorage.setItem("language", language);
    alert("Bahasa berhasil disimpan.");
    toggleSettingPage(false);
}

window.onload = function () {
    const saved = localStorage.getItem("language");
    if (saved) {
        const radio = document.querySelector(`input[value="${saved}"]`);
        if (radio) radio.checked = true;
    }
}

// --- 3. MESIN GAME MULTI-LEVEL ---
const levels = [
    {
        level: 1,
        map: [[0, 0, 2, 0, 0], [1, 1, 0, 1, 0], [0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 2, 0, 0, 0]],
        robotStart: { x: 0, y: 0 },
        totalCoins: 2,
        starterCode: `# Kumpulkan 2 Bintang \n# Hindari blok oranye\n\nmove_right()\nmove_right()\ncollect()\nmove_down()\nmove_down()\nmove_right()\nmove_right()\nmove_down()\nmove_down()\nmove_left()\nmove_left()\nmove_left()\ncollect()`
    },
    {
        level: 2,
        map: [[0, 0, 0, 0, 2], [0, 1, 0, 1, 0], [0, 0, 0, 0, 0], [1, 0, 1, 0, 1], [2, 0, 0, 0, 0]],
        robotStart: { x: 0, y: 0 },
        totalCoins: 2,
        starterCode: `# Level 2: Kumpulkan 2 Bintang\n# Jalur lebih berliku, perhatikan dinding!\n\n`
    },
    {
        level: 3,
        map: [[0, 0, 0, 0, 0], [0, 1, 0, 1, 0], [2, 0, 0, 0, 2], [0, 1, 0, 1, 0], [0, 0, 2, 0, 0]],
        robotStart: { x: 2, y: 0 },
        totalCoins: 3,
        starterCode: `# Level 3: Kumpulkan 3 Bintang\n# Posisi awalmu ada di tengah papan!\n\n`
    },
    {
        level: 4,
        map: [[0, 1, 2, 1, 0], [0, 0, 0, 0, 0], [1, 0, 1, 0, 1], [0, 0, 0, 0, 0], [0, 1, 2, 0, 2]],
        robotStart: { x: 0, y: 0 },
        totalCoins: 3,
        starterCode: `# Level 4: Kumpulkan 3 Bintang\n# Rintangan semakin kompleks, hati-hati!\n\n`
    },
    {
        level: 5,
        map: [[2, 0, 1, 0, 2], [0, 0, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 0, 0], [2, 0, 1, 0, 2]],
        robotStart: { x: 2, y: 1 },
        totalCoins: 4,
        starterCode: `# LEVEL FINAL: Kumpulkan 4 Bintang!\n# Kamu mulai di tengah. Butuh strategi terbaik!\n\n`
    }
];

let currentLevelIndex = 0;
let currentMap = [];
let robotPos = { x: 0, y: 0 };
let collectedCoins = 0;
let isExecuting = false;

const MOVE_DELTAS = {
    'move_right()': { dx: 1, dy: 0 },
    'move_left()': { dx: -1, dy: 0 },
    'move_down()': { dx: 0, dy: 1 },
    'move_up()': { dx: 0, dy: -1 }
};

function loadLevel(index) {
    currentLevelIndex = index;
    const level = levels[index];

    document.getElementById('levelBadge').innerText = `LEVEL ${level.level} / ${levels.length}`;
    document.getElementById('codeEditor').value = level.starterCode;

    initGame();
    hideOverlay();
    clearLog();

    if (index === 0) {
        logMsg("Selamat datang! Ketik kodemu dan tekan Jalankan.");
    } else {
        logMsg(`🎉 Level ${level.level} dimulai!\n\nTarget:\nKumpulkan ${level.totalCoins} bintang.`, "log-success");
    }
}

function initGame() {
    const level = levels[currentLevelIndex];
    currentMap = JSON.parse(JSON.stringify(level.map));
    robotPos = { x: level.robotStart.x, y: level.robotStart.y };
    collectedCoins = 0;
    updateScore();
    renderBoard();
}

function renderBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (currentMap[y][x] === 1) cell.classList.add('wall');
            if (currentMap[y][x] === 2) cell.classList.add('coin');
            if (robotPos.x === x && robotPos.y === y) cell.classList.add('robot');
            board.appendChild(cell);
        }
    }
}

function updateScore() {
    const total = levels[currentLevelIndex].totalCoins;
    document.getElementById('scoreText').innerText = `${collectedCoins} / ${total}`;
}

function hideOverlay() {
    const overlay = document.getElementById('statusOverlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
}

function showOverlay() {
    const overlay = document.getElementById('statusOverlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

function setRunButtonState(isRunning) {
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtnTop');

    runBtn.disabled = isRunning;
    resetBtn.disabled = isRunning;
    resetBtn.classList.toggle('opacity-50', isRunning);
    resetBtn.classList.toggle('cursor-not-allowed', isRunning);

    runBtn.innerHTML = isRunning
        ? '<i class="fa-solid fa-spinner fa-spin mr-2"></i> MENJALANKAN...'
        : '<i class="fa-solid fa-play mr-2"></i> JALANKAN';
}

function logMsg(text, className = "log-item") {
    const consoleDiv = document.getElementById('consoleLog');
    const logEl = document.createElement('div');
    logEl.className = `log-item ${className}`;
    logEl.innerText = text;
    consoleDiv.appendChild(logEl);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function clearLog() {
    document.getElementById('consoleLog').innerHTML = '';
}

async function executeCode() {
    if (isExecuting) return;
    isExecuting = true;
    setRunButtonState(true);

    try {
        hideOverlay();
        initGame();
        clearLog();

        const codeText = document.getElementById('codeEditor').value;
        const lines = codeText.split('\n').map(line => line.trim()).filter(line => line !== '' && !line.startsWith('#'));

        logMsg("Memulai langkah...", "log-active");

        const level = levels[currentLevelIndex];
        const stepDelay = 600;
        let errorOccurred = false;

        for (let i = 0; i < lines.length; i++) {
            if (errorOccurred) break;
            const cmd = lines[i];
            logMsg(`Step ${i + 1}\n${cmd}`, "log-active");

            await new Promise(r => setTimeout(r, stepDelay));

            if (cmd === 'collect()') {
                if (currentMap[robotPos.y][robotPos.x] === 2) {
                    currentMap[robotPos.y][robotPos.x] = 0;
                    collectedCoins++;
                    updateScore();
                    logMsg(`Yeay! Bintang didapatkan!`, "log-success");
                    renderBoard();
                } else {
                    logMsg(`Ups, tidak ada bintang di sini.`, "log-error");
                }
                continue;
            }

            const delta = MOVE_DELTAS[cmd];
            if (!delta) {
                logMsg(`Kode salah: '${cmd}'`, "log-error");
                errorOccurred = true;
                showEndScreen(false, "Kode yang kamu ketik tidak dikenali.");
                break;
            }

            const newX = robotPos.x + delta.dx;
            const newY = robotPos.y + delta.dy;

            if (newX < 0 || newX > 4 || newY < 0 || newY > 4) {
                logMsg(`Awas jatuh! Keluar batas.`, "log-error");
                errorOccurred = true;
                showEndScreen(false, "Karaktermu keluar dari area permainan!");
                break;
            }

            if (currentMap[newY][newX] === 1) {
                logMsg(`Aduh! Menabrak blok.`, "log-error");
                errorOccurred = true;
                showEndScreen(false, "Karaktermu menabrak halangan.");
                break;
            }

            robotPos.x = newX;
            robotPos.y = newY;
            renderBoard();
        }

        if (!errorOccurred) {
            if (collectedCoins === level.totalCoins) {
                logMsg("Hore! Level Selesai.", "log-success");
                if (currentLevelIndex === levels.length - 1) {
                    showEndScreen(true, "Kamu berhasil menyelesaikan seluruh level!");
                } else {
                    showEndScreen(true, "Kamu berhasil menyelesaikan tantangan ini!");
                }
            } else {
                logMsg(`Masih kurang ${level.totalCoins - collectedCoins} bintang.`, "log-error");
                showEndScreen(false, "Kodenya selesai, tapi masih ada bintang yang tertinggal.");
            }
        }
    } finally {
        isExecuting = false;
        setRunButtonState(false);
    }
}

function showEndScreen(isSuccess, desc) {
    const title = document.getElementById('statusText');
    const descText = document.getElementById('statusDesc');
    const icon = document.getElementById('statusIcon');
    const nextBtn = document.getElementById('nextBtn');

    showOverlay();
    descText.innerText = desc;

    if (isSuccess) {
        const isLastLevel = currentLevelIndex === levels.length - 1;
        title.className = "text-3xl font-black text-green-500 mb-2";

        if (isLastLevel) {
            title.innerText = "SELAMAT!";
            icon.className = "fa-solid fa-trophy text-6xl text-yellow-400 mb-4 drop-shadow-md";
            nextBtn.innerHTML = 'MAIN LAGI <i class="fa-solid fa-rotate-left ml-2"></i>';
            nextBtn.onclick = restartGame;
        } else {
            title.innerText = "HEBAT!";
            icon.className = "fa-solid fa-award text-6xl text-yellow-400 mb-4 drop-shadow-md";
            nextBtn.innerHTML = 'LANJUT <i class="fa-solid fa-forward-step ml-2"></i>';
            nextBtn.onclick = nextLevel;
        }
    } else {
        title.innerText = "YAHH GAGAL!";
        title.className = "text-3xl font-black text-red-500 mb-2";
        icon.className = "fa-solid fa-face-frown-open text-6xl text-red-400 mb-4 drop-shadow-md";
        nextBtn.innerHTML = 'COBA LAGI <i class="fa-solid fa-rotate-right ml-2"></i>';
        nextBtn.onclick = resetGame;
    }
}

async function nextLevel() {
    if (currentLevelIndex >= levels.length - 1 || isExecuting) return;
    isExecuting = true;
    setRunButtonState(true);

    hideOverlay();
    clearLog();
    logMsg(`Level ${levels[currentLevelIndex].level} selesai!`, "log-success");
    logMsg(`Memuat Level ${levels[currentLevelIndex + 1].level}...`, "log-active");

    await new Promise(r => setTimeout(r, 1000));
    loadLevel(currentLevelIndex + 1);

    isExecuting = false;
    setRunButtonState(false);
}

function restartGame() {
    if (isExecuting) return;
    loadLevel(0);
}

function resetGame() {
    if (isExecuting) return;
    hideOverlay();
    initGame();
    clearLog();
    logMsg("Papan diatur ulang. Ayo coba lagi!");
}