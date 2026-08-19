    (function () {
      const screen = document.getElementById('screen');
      const output = document.getElementById('output');
      const anchor = document.getElementById('anchor');
      const terminal = document.getElementById('terminal');

      // ---------------------------------------------------------------
      // Sakura petal system — ambient falling petals + a "hanami" burst.
      // Lives on its own <canvas> behind the glass panel, so the panel's
      // backdrop-filter blur picks up soft drifting pink through the glass.
      // ---------------------------------------------------------------
      const petalsCanvas = document.getElementById('petalsCanvas');
      const pctx = petalsCanvas.getContext('2d');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const PETAL_COLORS_LIGHT = ['#ffd9e2', '#ffb7c9', '#ff9fb8', '#ffe6ee', '#ffc9d8'];
      const PETAL_COLORS_DARK = ['#ffd0e6', '#ff9ac8', '#e8a6ff', '#ffe3f2', '#c9a3ff'];
      let activePetalColors = PETAL_COLORS_LIGHT;

      let petals = [];
      let petalAnimId = null;
      let lastTs = null;
      let clockSec = 0;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Twinkling stars — only drawn while yozakura (dark) mode is active.
      let stars = [];
      function seedStars(count) {
        const w = window.innerWidth, h = window.innerHeight;
        stars = [];
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.55, // keep them up in the "sky", not the whole screen
            r: 0.6 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 1.0,
          });
        }
      }

      function drawStars() {
        if (!document.body.classList.contains('yozakura')) return;
        for (const s of stars) {
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(clockSec * s.speed + s.phase));
          pctx.globalAlpha = twinkle;
          pctx.fillStyle = '#fff8fb';
          pctx.beginPath();
          pctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          pctx.fill();
        }
        pctx.globalAlpha = 1;
      }

      function resizePetalsCanvas() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        petalsCanvas.width = Math.max(1, Math.floor(w * dpr));
        petalsCanvas.height = Math.max(1, Math.floor(h * dpr));
        petalsCanvas.style.width = w + 'px';
        petalsCanvas.style.height = h + 'px';
        pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function makePetal(opts) {
        opts = opts || {};
        const w = window.innerWidth;
        return {
          baseX: opts.x !== undefined ? opts.x : Math.random() * w,
          x: 0,
          y: opts.y !== undefined ? opts.y : -20 - Math.random() * 200,
          size: opts.size || (8 + Math.random() * 10),
          fallSpeed: opts.fallSpeed || (12 + Math.random() * 18), // px/sec
          swayAmp: 14 + Math.random() * 26,
          swayFreq: 0.3 + Math.random() * 0.5, // rad/sec
          phase: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.6, // rad/sec
          color: activePetalColors[Math.floor(Math.random() * activePetalColors.length)],
          opacity: 0.5 + Math.random() * 0.35,
          t: 0,
          burst: !!opts.burst,
        };
      }

      function seedPetals(count) {
        petals = [];
        for (let i = 0; i < count; i++) {
          petals.push(makePetal({ y: Math.random() * window.innerHeight }));
        }
      }

      function drawPetal(p) {
        pctx.save();
        pctx.translate(p.x, p.y);
        pctx.rotate(p.rot);
        pctx.globalAlpha = p.opacity;
        pctx.fillStyle = p.color;
        pctx.beginPath();
        // small teardrop petal shape
        pctx.moveTo(0, -p.size / 2);
        pctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size / 2, p.size / 2, 0, p.size / 2);
        pctx.bezierCurveTo(-p.size / 2, p.size / 2, -p.size / 2, -p.size / 2, 0, -p.size / 2);
        pctx.fill();
        pctx.restore();
      }

      function stepPetals(dtMs) {
        const dt = Math.min(dtMs, 60) / 1000; // clamp for tab-switch jumps
        clockSec += dt;
        const w = window.innerWidth, h = window.innerHeight;
        pctx.clearRect(0, 0, w, h);
        drawStars();
        for (let i = petals.length - 1; i >= 0; i--) {
          const p = petals[i];
          p.t += dt;
          p.y += p.fallSpeed * dt;
          p.rot += p.rotSpeed * dt;
          p.x = p.baseX + Math.sin(p.t * p.swayFreq + p.phase) * p.swayAmp;
          if (p.y > h + 30) {
            if (p.burst) {
              petals.splice(i, 1);
              continue;
            }
            p.y = -20;
            p.baseX = Math.random() * w;
            p.t = 0;
          }
          drawPetal(p);
        }
      }

      function petalLoop(ts) {
        if (lastTs == null) lastTs = ts;
        const dt = ts - lastTs;
        lastTs = ts;
        stepPetals(dt);
        petalAnimId = requestAnimationFrame(petalLoop);
      }

      function startPetals() {
        if (reducedMotion) return; // respect the user's OS-level preference
        resizePetalsCanvas();
        const count = window.innerWidth < 640 ? 10 : 22;
        seedPetals(count);
        seedStars(window.innerWidth < 640 ? 40 : 80);
        lastTs = null;
        if (petalAnimId) cancelAnimationFrame(petalAnimId);
        petalAnimId = requestAnimationFrame(petalLoop);
      }

      function triggerHanamiBurst() {
        if (reducedMotion) return;
        const w = window.innerWidth;
        const burstCount = w < 640 ? 22 : 42;
        for (let i = 0; i < burstCount; i++) {
          petals.push(makePetal({
            x: Math.random() * w,
            y: -30 - Math.random() * 220,
            fallSpeed: 26 + Math.random() * 30,
            size: 9 + Math.random() * 12,
            burst: true,
          }));
        }
      }

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          startPetals();
        }, 200);
      });

      startPetals();

      // ---------------------------------------------------------------
      // Theme — sakura (light) / yozakura (dark). Remembered across
      // visits, defaults to the visitor's OS-level light/dark preference.
      // ---------------------------------------------------------------
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');

      function applyTheme(mode) {
        const dark = mode === 'dark';
        document.body.classList.toggle('yozakura', dark);
        activePetalColors = dark ? PETAL_COLORS_DARK : PETAL_COLORS_LIGHT;
        if (metaThemeColor) metaThemeColor.setAttribute('content', dark ? '#ff5da2' : '#dc143c');
      }

      function getStoredTheme() {
        try { return localStorage.getItem('dk-theme'); } catch (e) { return null; }
      }

      function storeTheme(mode) {
        try { localStorage.setItem('dk-theme', mode); } catch (e) { /* ignore */ }
      }

      let currentTheme = getStoredTheme();
      if (currentTheme !== 'dark' && currentTheme !== 'light') {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      applyTheme(currentTheme);

      const GH = "https://github.com/Deepak-kumar-36";
      const LI = "https://www.linkedin.com/in/deepak---kumar/";
      const LC = "https://leetcode.com/Deepak--Kumar/";
      const CF = "https://codeforces.com/profile/Deepak_36";
      const MAIL = "deepakkumarsaha37@gmail.com";
      // TODO: replace with your real resume link (Google Drive/PDF/etc),
      // or point it at "/resume.pdf" if you add that file to the repo root.
      const RESUME_URL = "my_resume.pdf";

      const BANNER = `<img src="profile.png" width="160" />`;

      const PROJECTS = {
        railmind: {
          name: "RailMind",
          desc: "AI-powered railway safety and emergency response platform — cloud infra plus intelligent automation for real-time incident response.",
          link: "https://github.com/Deepak-kumar-36/RailMind"
        },
        levelingup: {
          name: "Leveling Up",
          desc: "A self-improvement and habit-tracking platform — set goals, build streaks, and track progress across different areas of life.",
          link: "https://github.com/Deepak-kumar-36/LevelingUp"
        }
      };

      const HAIKUS = [
        "stray semicolon\nfalls quiet, like a petal —\nbuild breaks in silence",
        "old code, cherry tree\nboth bloom again in springtime\nwith one clean commit",
        "server sleeps at night\nunder a moon of pull requests\nwaiting to be merged",
        "blossoms drift and fall\nso does every unit test\nI forgot to write",
        "terminal glows warm\npetals settle on the glass —\nstill compiling, still",
        "green light on the build\na branch of sakura sways\nnothing left to fix",
      ];
      let lastHaikuIdx = -1;

      function esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      function printRaw(html) {
        const div = document.createElement('div');
        div.className = 'line';
        div.innerHTML = html;
        output.appendChild(div);
      }

      function println(text, cls) {
        printRaw(`<span class="${cls || 'fg'}">${esc(text)}</span>`);
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function scrollDown() {
        screen.scrollTop = screen.scrollHeight;
      }

      function typeLine(text, cls, speed) {
        return new Promise((resolve) => {
          const div = document.createElement('div');
          div.className = 'line ' + (cls || 'fg');
          output.appendChild(div);
          if (prefersReducedMotion) {
            div.textContent = text;
            scrollDown();
            resolve();
            return;
          }
          let i = 0;
          const s = speed || 14;
          function step() {
            div.textContent = text.slice(0, i);
            i++;
            scrollDown();
            if (i <= text.length) {
              setTimeout(step, s);
            } else {
              resolve();
            }
          }
          step();
        });
      }

      function sleep(ms) { return prefersReducedMotion ? Promise.resolve() : new Promise(r => setTimeout(r, ms)); }

      function printBanner() {
        let html = `<div style="display:flex; align-items:center; gap:20px; margin:10px 0 15px;">`;
        html += `<div style="flex:0 0 auto;">${BANNER}</div>`;
        html += `<div>`;
        const info = [
          ["whoami", "Deepak Kumar"],
          ["role", "Software Developer · Open Source Enthusiast · AI &amp; Backend Dev"],
          ["stack", "Python · C · C++ · Java · JavaScript"],
          ["exploring", "DSA · Artificial Intelligence · Cloud Computing · System Design"],
          ["os", "Arch Linux"],
        ];
        info.forEach(([k, v]) => {
          html += `<div class="line"><span class="amber">${k.padEnd(11, ' ')}</span><span class="dim">›</span> <span class="fg">${v}</span></div>`;
        });
        html += `</div></div>`;
        printRaw(html);
      }

      const COMMANDS = {
        help() {
          println("available commands", "dim");
          const rows = [
            ["whoami", "who is running this shell"],
            ["about", "a short bio"],
            ["skills", "languages, tools, what I'm exploring"],
            ["projects", "list featured projects"],
            ["open <project>", "open a project's repo"],
            ["contact", "email, LinkedIn, GitHub"],
            ["coding", "LeetCode / Codeforces profiles"],
            ["banner", "reprint the boot banner"],
            ["hanami", "stop and watch the blossoms fall 🌸"],
            ["haiku", "a small poem, picked at random"],
            ["date", "today's date and time"],
            ["theme [dark|light]", "toggle day / night sakura"],
            ["resume", "open my resume"],
            ["clear", "clear the screen"],
            ["sudo make-coffee", "..."],
            ["exit", "try it and see"],
          ];
          rows.forEach(([cmd, desc]) => {
            printRaw(`<div class="line"><span class="amber">${cmd.padEnd(18, ' ')}</span><span class="dim">${esc(desc)}</span></div>`);
          });
        },

        whoami() {
          println("Deepak Kumar", "amber");
          println("Software Developer · Open Source Enthusiast · AI & Backend Developer", "fg");
        },

        about() {
          println("Backend-leaning developer who likes building things that actually ship —", "fg");
          println("from AI-assisted tooling to small games to automation scripts. Currently", "fg");
          println("deep in data structures & algorithms, cloud computing, and system design.", "fg");
          println("Runs Arch. Lives in the terminal. Contributes where I can.", "fg");
        },

        skills() {
          println("Languages", "amber");
          println("  Python, C, C++, Java, JavaScript, HTML, CSS", "fg");
          println("");
          println("Tools", "amber");
          println("  Git, GitHub, Linux (Arch), Firebase, Supabase, VS Code", "fg");
          println("");
          println("Currently exploring", "amber");
          println("  Data Structures & Algorithms, AI, Cloud Computing, System Design", "fg");
        },

        projects() {
          println("featured projects  (try: open <name>)", "dim");
          Object.entries(PROJECTS).forEach(([key, p]) => {
            printRaw(`<div class="line"><span class="amber">${key}</span></div>`);
            printRaw(`<div class="line dim">  ${esc(p.desc)}</div>`);
          });
        },

        ls() { this.projects(); },

        open(args) {
          if (!args[0]) {
            println("open: missing project name. Try: projects", "danger");
            return;
          }
          const key = args[0].toLowerCase();
          const p = PROJECTS[key];
          if (!p) {
            println(`open: no project named '${esc(args[0])}'. Try: projects`, "danger");
            return;
          }
          println(`opening ${p.name}…`, "dim");
          window.open(p.link, "_blank");
        },

        contact() {
          printRaw(`<div class="line"><span class="amber">email</span>     <a href="mailto:${MAIL}">${MAIL}</a></div>`);
          printRaw(`<div class="line"><span class="amber">linkedin</span>  <a href="${LI}" target="_blank" rel="noopener">linkedin.com/in/deepak---kumar</a></div>`);
          printRaw(`<div class="line"><span class="amber">github</span>    <a href="${GH}" target="_blank" rel="noopener">github.com/Deepak-kumar-36</a></div>`);
        },

        coding() {
          printRaw(`<div class="line"><span class="amber">leetcode</span>    <a href="${LC}" target="_blank" rel="noopener">leetcode.com/Deepak--Kumar</a></div>`);
          printRaw(`<div class="line"><span class="amber">codeforces</span>  <a href="${CF}" target="_blank" rel="noopener">codeforces.com/profile/Deepak_36</a></div>`);
        },

        banner() { printBanner(); },
        neofetch() { printBanner(); },

        hanami() {
          println("🌸 hanami — a moment to stop and watch the blossoms fall.", "amber");
          triggerHanamiBurst();
        },

        haiku() {
          let idx = Math.floor(Math.random() * HAIKUS.length);
          if (HAIKUS.length > 1 && idx === lastHaikuIdx) {
            idx = (idx + 1) % HAIKUS.length;
          }
          lastHaikuIdx = idx;
          const lines = HAIKUS[idx].split("\n");
          printRaw(`<div class="line dim" style="margin-top:4px;">— a haiku —</div>`);
          lines.forEach(l => println(l, "amber"));
          printRaw(`<div class="line" style="margin-bottom:2px;"></div>`);
        },

        date() {
          const now = new Date();
          const dateStr = now.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });
          const timeStr = now.toLocaleTimeString(undefined, {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          println(`${dateStr}`, "amber");
          println(`${timeStr}`, "fg");
        },

        theme(args) {
          const arg = (args[0] || '').toLowerCase();
          let target;
          if (arg === 'dark' || arg === 'light') {
            target = arg;
          } else {
            target = document.body.classList.contains('yozakura') ? 'light' : 'dark';
          }
          currentTheme = target;
          applyTheme(target);
          storeTheme(target);
          println(
            target === 'dark' ? "yozakura — night sakura. 🌙" : "sakura — daylight. ☀️",
            "amber"
          );
        },

        resume() {
          if (!RESUME_URL) {
            println("no resume linked yet — reach out directly and I'll send one over:", "dim");
            println(`  ${MAIL}`, "amber");
            return;
          }
          println("opening resume…", "dim");
          window.open(RESUME_URL, "_blank");
        },

        clear() {
          output.innerHTML = "";
        },

        echo(args) {
          println(args.join(" "), "fg");
        },

        exit() {
          println("there is no exit from a portfolio. nice try though.", "dim");
        },

        "sudo"(args) {
          const sub = (args || []).join(" ");
          if (sub === "make-coffee") {
            println("brewing…", "dim");
            println("☕ coffee's ready. back to work.", "amber");
            return;
          }
          println("Permission denied: some things you have to build yourself.", "danger");
        },
      };

      let cmdHistory = [];
      let historyIndex = -1;

      let hintTimer = null;
      let isHinting = false;
      let currentHint = "";
      const HINTS = ["help", "projects", "socials", "about", "clear", "skills"];
      let hintIndex = 0;
      let hintCharIndex = 0;
      let isDeleting = false;

      function startHintAnimation() {
        if (!inputEl || inputEl.value.length > 0) {
          isHinting = false;
          syncMirror();
          return;
        }
        isHinting = true;
        let word = HINTS[hintIndex];

        if (!isDeleting && hintCharIndex <= word.length) {
          currentHint = word.substring(0, hintCharIndex);
          hintCharIndex++;
          syncMirror();
          if (hintCharIndex <= word.length) {
            hintTimer = setTimeout(startHintAnimation, 120 + Math.random() * 80);
          } else {
            isDeleting = true;
            hintTimer = setTimeout(startHintAnimation, 2000); // pause before delete
          }
        } else if (isDeleting && hintCharIndex > 0) {
          hintCharIndex--;
          currentHint = word.substring(0, hintCharIndex);
          syncMirror();
          hintTimer = setTimeout(startHintAnimation, 60);
        } else if (isDeleting && hintCharIndex === 0) {
          isDeleting = false;
          hintIndex = (hintIndex + 1) % HINTS.length;
          hintTimer = setTimeout(startHintAnimation, 1000); // pause before next word
        }
      }

      function resetHint() {
        if (hintTimer) clearTimeout(hintTimer);
        isHinting = false;
        currentHint = "";
        hintCharIndex = 0;
        isDeleting = false;

        // Restart the hint animation after 3 seconds of inactivity
        if (inputEl && inputEl.value.length === 0) {
          hintTimer = setTimeout(startHintAnimation, 3000);
        }
      }

      function makePromptRow() {
        const row = document.createElement('div');
        row.className = 'prompt-row';
        row.innerHTML = `
      <span class="prompt"><span class="amber">deepak</span><span class="dim">@</span><span class="amber">kumar</span><span class="dim">:</span><span class="path">~</span><span class="dim">$</span></span>
      <span class="input-area"><input class="hidden-input" autocomplete="off" autocapitalize="off" spellcheck="false" /><span class="input-mirror"></span><span class="cursor"></span></span>
    `;
        return row;
      }

      let inputEl = null;
      let mirrorEl = null;

      function newPrompt() {
        const row = makePromptRow();
        output.appendChild(row);
        inputEl = row.querySelector('.hidden-input');
        mirrorEl = row.querySelector('.input-mirror');
        inputEl.addEventListener('keydown', onKeydown);
        inputEl.addEventListener('input', () => {
          resetHint();
          syncMirror();
        });
        inputEl.focus();
        scrollDown();
        resetHint();
      }

      function syncMirror() {
        if (mirrorEl && inputEl) {
          if (inputEl.value.length > 0) {
            mirrorEl.textContent = inputEl.value;
            mirrorEl.classList.remove('hinting');
          } else if (isHinting) {
            mirrorEl.textContent = currentHint;
            mirrorEl.classList.add('hinting');
          } else {
            mirrorEl.textContent = "";
            mirrorEl.classList.remove('hinting');
          }
          scrollDown();
        }
      }

      function runCommand(raw) {
        if (hintTimer) clearTimeout(hintTimer);
        const trimmed = raw.trim();
        if (trimmed.length === 0) return;
        cmdHistory.push(trimmed);
        historyIndex = cmdHistory.length;

        const parts = trimmed.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (COMMANDS.hasOwnProperty(cmd)) {
          try {
            COMMANDS[cmd](args);
          } catch (e) {
            println(`error running '${cmd}'`, "danger");
          }
        } else {
          println(`command not found: ${cmd} — type 'help' to see what's available`, "danger");
        }
      }

      function onKeydown(e) {
        resetHint();
        if (e.key === 'Enter') {
          const val = inputEl.value;
          // freeze the finished line
          const frozen = document.createElement('div');
          frozen.className = 'prompt-row';
          frozen.innerHTML = `<span class="prompt"><span class="amber">deepak</span><span class="dim">@</span><span class="amber">kumar</span><span class="dim">:</span><span class="path">~</span><span class="dim">$</span></span> <span class="fg">${esc(val)}</span>`;
          inputEl.closest('.prompt-row').replaceWith(frozen);

          runCommand(val);
          newPrompt();
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          if (cmdHistory.length) {
            historyIndex = Math.max(0, historyIndex - 1);
            inputEl.value = cmdHistory[historyIndex] || "";
            syncMirror();
            setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
          }
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (cmdHistory.length) {
            historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
            inputEl.value = cmdHistory[historyIndex] || "";
            syncMirror();
          }
          e.preventDefault();
        }
      }

      screen.addEventListener('click', () => { if (inputEl) inputEl.focus(); });

      async function boot() {
        const bootLines = [
          ["initializing shell…", "muted"],
          ["loading profile: deepak-kumar-36", "muted"],
          ["mounting /home/deepak", "muted"],
          ["connection established.", "ok"],
        ];
        for (const [text, cls] of bootLines) {
          await typeLine(text, cls, 10);
          await sleep(90);
        }
        await sleep(150);
        printBanner();
        println("");
        println("type 'help' to see available commands.", "dim");
        println("");
        newPrompt();
      }

      boot();
    })();
