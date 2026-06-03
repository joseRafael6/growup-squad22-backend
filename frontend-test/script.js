const API = 'http://localhost:3000';
let clerk, currentUser = null, currentSessionId = null;

// ── Init Clerk ──────────────────────────────────────────────────────────────
async function initClerk() {
  clerk = window.Clerk;
  await clerk.load();

  if (clerk.user) {
    currentUser = clerk.user;
    showUserSection();
  } else {
    showLoginSection();
  }

  clerk.addListener(({ user }) => {
    if (user && !currentUser) {
      currentUser = user;
      showUserSection();
    } else if (!user && currentUser) {
      currentUser = null;
      showLoginSection();
    }
  });
}

async function token() {
  return clerk.session.getToken();
}

// ── Sections ────────────────────────────────────────────────────────────────
function showLoginSection() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('user-section').style.display = 'none';
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('user-badge').style.display = 'none';
  const signInDiv = document.getElementById('clerk-sign-in');
  signInDiv.innerHTML = '';
  clerk.mountSignIn(signInDiv, {
    appearance: { variables: { colorPrimary: '#007bff' } }
  });
}

async function showUserSection() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('user-section').style.display = 'block';
  document.getElementById('logout-btn').style.display = 'inline-block';
  const role = currentUser.publicMetadata?.role || 'user';
  document.getElementById('admin-section').style.display = role === 'admin' ? 'block' : 'none';
  await refreshBadge();
  await loadCategories();
  if (role === 'admin') await loadAdminCategories();
}

// ── Badge ───────────────────────────────────────────────────────────────────
async function refreshBadge() {
  const email = currentUser.primaryEmailAddress?.emailAddress || '';
  const role = currentUser.publicMetadata?.role || 'user';
  document.getElementById('user-badge').style.display = 'flex';
  document.getElementById('badge-email').textContent = '✅ ' + email;
  document.getElementById('badge-role').textContent = role === 'admin' ? '👑 Admin' : '👤 Usuário';
  try {
    const res = await fetch(API + '/api/users/me', { headers: { Authorization: 'Bearer ' + await token() } });
    if (res.ok) {
      const d = await res.json();
      document.getElementById('badge-company').textContent = d.companyName ? 'empresa: ' + d.companyName : '';
      document.getElementById('badge-sector').textContent = d.sector ? 'setor: ' + d.sector : '';
      const sel = document.getElementById('ranking-company');
      sel.innerHTML = '';
      (d.companies || []).forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name;
        sel.appendChild(o);
      });
    }
  } catch (e) {}
}

// ── Categories ──────────────────────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await fetch(API + '/questions/categories', { headers: { Authorization: 'Bearer ' + await token() } });
    if (!res.ok) return;
    const cats = await res.json();
    const sel = document.getElementById('quiz-category');
    sel.innerHTML = '<option value="">Selecione a categoria...</option>';
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
  } catch (e) {}
}

async function loadAdminCategories() {
  try {
    const res = await fetch(API + '/admin/categories', { headers: { Authorization: 'Bearer ' + await token() } });
    if (!res.ok) return;
    const cats = await res.json();
    const sel = document.getElementById('admin-filter-category');
    sel.innerHTML = '<option value="">Todas as categorias</option>';
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
  } catch (e) {}
}

// ── Company Quizzes ─────────────────────────────────────────────────────────
async function loadCompanyQuizzes() {
  try {
    const res = await fetch(API + '/api/users/me', { headers: { Authorization: 'Bearer ' + await token() } });
    if (!res.ok) return;
    const d = await res.json();
    const sel = document.getElementById('quiz-company-quiz');
    sel.innerHTML = '<option value="">Selecione um quiz...</option>';
    for (const company of (d.adminOf || [])) {
      const r2 = await fetch(API + '/companies/' + company.id + '/quizzes', { headers: { Authorization: 'Bearer ' + await token() } });
      if (!r2.ok) continue;
      const quizzes = await r2.json();
      quizzes.forEach(q => {
        const o = document.createElement('option');
        o.value = q.id;
        o.textContent = company.name + ' — ' + q.name + ' (' + q.questionCount + ' perguntas)';
        sel.appendChild(o);
      });
    }
  } catch (e) {}
}

// ── Quiz ────────────────────────────────────────────────────────────────────
async function startQuiz() {
  const mode = document.getElementById('quiz-mode').value;
  const category = document.getElementById('quiz-category').value;
  const limit = document.getElementById('quiz-limit').value || 10;

  if (mode === 'global_category' && !category) { alert('Selecione uma categoria'); return; }

  let url = API + '/questions?mode=' + mode + '&limit=' + limit;
  if (mode === 'global_category') url += '&category=' + encodeURIComponent(category);

  try {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + await token() } });
    if (!res.ok) { const e = await res.json(); alert(e.message || e.error); return; }
    const data = await res.json();
    currentSessionId = data.sessionId;
    renderQuiz(data.questions, data.rankingScope);
  } catch (e) { alert('Erro: ' + e.message); }
}

// ── Quiz: uma pergunta por vez com timer ─────────────────────────────────────
let _quizQuestions = [], _quizIndex = 0, _quizScope = '', _quizTimerInterval = null, _quizTimerStart = 0, _quizAnswered = false;

function renderQuiz(questions, rankingScope) {
  _quizQuestions = questions;
  _quizIndex = 0;
  _quizScope = rankingScope;
  _renderCurrentQuestion();
}

function _renderCurrentQuestion() {
  const area = document.getElementById('quiz-area');
  const q = _quizQuestions[_quizIndex];
  const total = _quizQuestions.length;
  const scopeLabel = _quizScope === 'company' ? '🏢 Ranking da Empresa' : '🌐 Ranking Geral';

  _quizAnswered = false;

  let altsHtml = '';
  q.alternatives.forEach(function(a) {
    altsHtml += '<button class="alt-btn" data-id="' + a.id + '" style="display:block;width:100%;text-align:left;margin:5px 0;padding:8px 12px;background:#fff;color:#333;border:1px solid #ccc;border-radius:6px;cursor:pointer;">' + a.text + '</button>';
  });

  area.innerHTML =
    '<p style="color:#888;font-size:.85rem;margin-bottom:8px;">Este quiz conta para o ' + scopeLabel + '</p>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<span style="font-size:.9rem;color:#555;">Pergunta <strong>' + (_quizIndex + 1) + '</strong> de <strong>' + total + '</strong> &nbsp;|&nbsp; Peso: ' + q.weight + '</span>' +
      '<span id="quiz-timer" style="font-size:1.1rem;font-weight:bold;color:#007bff;">⏱ ' + q.timeLimitSeconds + 's</span>' +
    '</div>' +
    '<div style="background:#e9ecef;border-radius:6px;height:8px;margin-bottom:14px;">' +
      '<div id="quiz-timer-bar" style="height:8px;border-radius:6px;background:#007bff;transition:width 0.4s linear;width:100%;"></div>' +
    '</div>' +
    '<div class="card" style="margin-top:0;">' +
      '<strong>' + q.text + '</strong>' +
      (q.category ? '<br><span style="display:inline-block;margin-top:6px;background:#dbeafe;color:#1d4ed8;padding:2px 10px;border-radius:12px;font-size:.78rem;font-weight:600;">📂 Categoria: ' + q.category + '</span>' : '') +
      '<div style="margin-top:12px;">' + altsHtml + '</div>' +
    '</div>' +
    '<div id="quiz-feedback" style="margin-top:10px;"></div>' +
    '<div id="quiz-nav" style="margin-top:10px;display:none;">' +
      '<button id="quiz-next-btn">' + (_quizIndex + 1 < total ? 'Próxima ➜' : 'Ver Resultado ✔') + '</button>' +
    '</div>';

  // Listeners das alternativas
  area.querySelectorAll('.alt-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (_quizAnswered) return;
      _quizAnswered = true;
      _stopQuizTimer();
      const responseTimeMs = Date.now() - _quizTimerStart;
      _disableAltBtns();
      await submitAnswer(q.id, btn.dataset.id, btn, responseTimeMs);
      document.getElementById('quiz-nav').style.display = 'block';
    });
  });

  // Botão próxima
  area.addEventListener('click', function handler(e) {
    if (e.target.id !== 'quiz-next-btn') return;
    area.removeEventListener('click', handler);
    _quizIndex++;
    if (_quizIndex < _quizQuestions.length) {
      _renderCurrentQuestion();
    } else {
      _showQuizResult();
    }
  });

  _startQuizTimer(q.timeLimitSeconds);
}

function _startQuizTimer(seconds) {
  _stopQuizTimer();
  _quizTimerStart = Date.now();
  const timerEl = document.getElementById('quiz-timer');
  const barEl = document.getElementById('quiz-timer-bar');

  _quizTimerInterval = setInterval(function() {
    const elapsed = (Date.now() - _quizTimerStart) / 1000;
    const remaining = Math.max(0, seconds - elapsed);
    const pct = (remaining / seconds) * 100;

    if (timerEl) timerEl.textContent = '⏱ ' + Math.ceil(remaining) + 's';
    if (barEl) {
      barEl.style.width = pct + '%';
      barEl.style.background = remaining <= seconds * 0.25 ? '#dc3545' : remaining <= seconds * 0.5 ? '#fd7e14' : '#007bff';
    }

    if (remaining <= 0 && !_quizAnswered) {
      _quizAnswered = true;
      _stopQuizTimer();
      _disableAltBtns();
      const fb = document.getElementById('quiz-feedback');
      if (fb) fb.innerHTML = '<span style="color:#fd7e14;">⏱ Tempo esgotado! Questão pulada.</span>';
      const nav = document.getElementById('quiz-nav');
      if (nav) nav.style.display = 'block';
    }
  }, 200);
}

function _stopQuizTimer() {
  clearInterval(_quizTimerInterval);
  _quizTimerInterval = null;
}

function _disableAltBtns() {
  document.querySelectorAll('.alt-btn').forEach(function(b) { b.disabled = true; b.style.cursor = 'default'; });
}

let _quizTotalScore = 0, _quizCorrect = 0;

function _showQuizResult() {
  const area = document.getElementById('quiz-area');
  const total = _quizQuestions.length;
  const pct = Math.round((_quizCorrect / total) * 100);
  area.innerHTML =
    '<div class="card" style="text-align:center;">' +
      '<h3>🏁 Quiz Concluído!</h3>' +
      '<p style="font-size:1.5rem;font-weight:bold;">' + _quizTotalScore + ' pontos</p>' +
      '<p>✅ Certas: <strong>' + _quizCorrect + '</strong> &nbsp;|&nbsp; ❌ Erradas/Timeout: <strong>' + (total - _quizCorrect) + '</strong> &nbsp;|&nbsp; ' + pct + '% de acerto</p>' +
      '<div id="quiz-result-rank" style="margin-top:12px;color:#555;font-size:.95rem;">🔄 Buscando sua posição no ranking...</div>' +
    '</div>';

  // Buscar posição no ranking geral após terminar o quiz
  (async function() {
    try {
      // Finaliza a sessão no backend antes de buscar o ranking
      await fetch(API + '/sessions/' + currentSessionId + '/finish', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + await token() }
      });

      const scope = _quizScope === 'company' ? 'company' : 'global';
      let url = API + '/ranking?scope=' + scope;
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + await token() } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const rankEl = document.getElementById('quiz-result-rank');
      if (!rankEl) return;
      if (data.myRank) {
        const scopeLabel = scope === 'company' ? '🏢 Ranking da Empresa' : '🌐 Ranking Geral';
        rankEl.innerHTML =
          '<strong>' + scopeLabel + '</strong><br>' +
          '📍 Você está na <strong>' + data.myRank.position + 'ª posição</strong> com <strong>' + data.myRank.score + ' pontos</strong>';
      } else {
        rankEl.textContent = 'Sua pontuação ainda não aparece no ranking.';
      }
    } catch(e) {
      const rankEl = document.getElementById('quiz-result-rank');
      if (rankEl) rankEl.textContent = '';
    }
  })();

  _quizTotalScore = 0;
  _quizCorrect = 0;
}

async function submitAnswer(questionId, optionId, btn, responseTimeMs) {
  try {
    const res = await fetch(API + '/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() },
      body: JSON.stringify({ sessionId: currentSessionId, questionId: questionId, optionId: optionId, responseTimeMs: responseTimeMs }),
    });
    const data = await res.json();
    const fb = document.getElementById('quiz-feedback');
    if (data.correct) {
      _quizCorrect++;
      btn.style.background = '#d4edda';
      btn.style.borderColor = '#28a745';
      if (fb) fb.innerHTML = '<span style="color:green;">✅ Correta! +' + data.pointsEarned + ' pts &nbsp;|&nbsp; Total: ' + data.totalScore + ' pts</span>';
    } else {
      btn.style.background = '#f8d7da';
      btn.style.borderColor = '#dc3545';
      if (fb) fb.innerHTML = '<span style="color:red;">❌ Errada! &nbsp;|&nbsp; Total: ' + data.totalScore + ' pts</span>';
    }
    _quizTotalScore = data.totalScore;
  } catch (e) {
    const fb = document.getElementById('quiz-feedback');
    if (fb) fb.innerHTML = '<span style="color:red;">Erro: ' + e.message + '</span>';
  }
}

// ── Ranking ─────────────────────────────────────────────────────────────────
async function showRanking() {
  const url = API + '/ranking?scope=global';

  try {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + await token() } });
    const data = await res.json();
    const area = document.getElementById('ranking-area');

    // Top 10 apenas
    const entries = (data.top10 || []).slice(0, 10);

    let html = '<h4>🌐 Ranking Global — Top 10</h4>';
    if (entries.length === 0) {
      html += '<p style="color:#888;">Nenhum resultado ainda.</p>';
    } else {
      html += '<ol style="padding-left:18px;">';
      entries.forEach(function(e, i) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + 'º';
        const isMe = data.myRank && e.position === data.myRank.position;
        html += '<li style="padding:4px 0;' + (isMe ? 'font-weight:bold;color:#007bff;' : '') + '">' +
          medal + ' ' +
          (e.name || ('Usuário ' + e.userId.substring(0, 8) + '...')) +
          ' &nbsp;|&nbsp; <strong>' + e.score + ' pts</strong>' +
          ' &nbsp;|&nbsp; ' + e.timeSeconds + 's' +
          (isMe ? ' 👈 você' : '') +
          '</li>';
      });
      html += '</ol>';
    }

    if (data.myRank) {
      html += '<div style="margin-top:12px;padding:10px 14px;background:#e8f4ff;border-left:4px solid #007bff;border-radius:4px;">' +
        '📍 <strong>Sua posição:</strong> ' + data.myRank.position + 'º lugar &nbsp;|&nbsp; ' + data.myRank.score + ' pontos' +
        '</div>';
    } else {
      html += '<p style="color:#888;font-size:.9rem;margin-top:10px;">Você ainda não completou um quiz neste ranking.</p>';
    }

    area.innerHTML = html;
  } catch (e) { alert('Erro: ' + e.message); }
}

// ── Sync ────────────────────────────────────────────────────────────────────
async function syncUser() {
  const email = currentUser.primaryEmailAddress?.emailAddress;
  const clerkId = currentUser.id;
  const name = document.getElementById('sync-name').value.trim() || currentUser.fullName || '';
  const companyName = document.getElementById('sync-company').value.trim();
  if (!companyName) { alert('Nome da empresa é obrigatório'); return; }
  const sector = document.getElementById('sync-sector').value.trim();
  const body = { email: email, name: name, clerkId: clerkId, companyName: companyName, sector: sector };

  try {
    const res = await fetch(API + '/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      let msg = '✅ Cadastro salvo!';
      if (data.company) msg += '\n🏢 Vinculado à: ' + data.company.name;
      alert(msg);
      await refreshBadge();
    } else {
      alert('Erro: ' + (data.error || data.message));
    }
  } catch (e) { alert('Erro: ' + e.message); }
}

// ── Admin ────────────────────────────────────────────────────────────────────
async function loadAdminQuestions() {
  const category = document.getElementById('admin-filter-category').value;
  let url = API + '/admin/questions';
  if (category) url += '?category=' + encodeURIComponent(category);

  try {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + await token() } });
    const questions = await res.json();
    const container = document.getElementById('questions-list');
    container.innerHTML = '<p>' + questions.length + ' pergunta(s) encontrada(s)</p>';

    questions.forEach(function(q) {
      const div = document.createElement('div');
      div.className = 'question-item';
      let altsHtml = '';
      q.alternatives.forEach(function(a) {
        altsHtml += '<span style="color:' + (a.isCorrect ? 'green' : '#555') + '">• ' + a.text + (a.isCorrect ? ' ✓' : '') + '</span> ';
      });

      let editAltsHtml = '';
      q.alternatives.forEach(function(a) {
        editAltsHtml +=
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<input type="text" class="ef-alt-text" value="' + a.text.replace(/"/g, '&quot;') + '" style="flex:1;padding:5px 8px;border:1px solid #ccc;border-radius:4px;">' +
            '<label style="display:flex;align-items:center;gap:4px;white-space:nowrap;">' +
              '<input type="radio" name="ef-correct-' + q.id + '" class="ef-alt-correct" ' + (a.isCorrect ? 'checked' : '') + '> Correta' +
            '</label>' +
          '</div>';
      });

      div.innerHTML =
        '<strong>' + q.text + '</strong>' +
        (q.category ? ' <span style="display:inline-block;background:#dbeafe;color:#1d4ed8;padding:2px 10px;border-radius:12px;font-size:.78rem;font-weight:600;">📂 Categoria: ' + q.category + '</span>' : '') +
        (q.sector ? ' <span style="background:#fff3e0;padding:2px 6px;border-radius:4px;font-size:.8rem;color:#b86e00;">setor: ' + q.sector + '</span>' : '') +
        '<br>Peso: ' + q.weight + ' | Tempo: ' + q.timeLimitSeconds + 's<br>' + altsHtml +
        '<br>' +
        '<button class="edit-btn" data-id="' + q.id + '" style="margin-top:6px;background:#4a90e2;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;margin-right:6px;">✏️ Editar</button>' +
        '<button class="delete-btn" data-id="' + q.id + '" style="margin-top:6px;background:#dc3545;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">🗑️ Excluir</button>' +
        '<div id="edit-form-' + q.id + '" style="display:none;margin-top:12px;padding:12px;background:#f4f7ff;border:1px solid #dde4ff;border-radius:6px;">' +
          '<label style="font-size:.85rem;font-weight:600;">Enunciado</label><br>' +
          '<input type="text" id="ef-text-' + q.id + '" value="' + q.text.replace(/"/g, '&quot;') + '" style="width:100%;padding:6px 10px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;"><br>' +
          '<label style="font-size:.85rem;font-weight:600;">Categoria</label><br>' +
          '<input type="text" id="ef-cat-' + q.id + '" value="' + (q.category || '') + '" style="width:100%;padding:6px 10px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;"><br>' +
          '<label style="font-size:.85rem;font-weight:600;">Peso</label> ' +
          '<input type="number" id="ef-weight-' + q.id + '" value="' + q.weight + '" style="width:80px;padding:6px;border:1px solid #ccc;border-radius:4px;margin-right:12px;">' +
          '<label style="font-size:.85rem;font-weight:600;">Tempo (s)</label> ' +
          '<input type="number" id="ef-time-' + q.id + '" value="' + q.timeLimitSeconds + '" style="width:80px;padding:6px;border:1px solid #ccc;border-radius:4px;"><br><br>' +
          '<label style="font-size:.85rem;font-weight:600;">Alternativas (marque a correta)</label>' +
          '<div id="ef-alts-' + q.id + '" style="margin-top:8px;">' + editAltsHtml + '</div>' +
          '<button class="save-edit-btn" data-id="' + q.id + '" style="margin-top:8px;background:#28a745;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;margin-right:6px;">💾 Salvar</button>' +
          '<button class="cancel-edit-btn" data-id="' + q.id + '" style="background:#888;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">✖ Cancelar</button>' +
        '</div>' +
        '<hr>';

      container.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Excluir esta pergunta?')) return;
        const res = await fetch(API + '/admin/questions/' + btn.dataset.id, {
          method: 'DELETE', headers: { Authorization: 'Bearer ' + await token() }
        });
        if (res.ok) {
          await loadAdminQuestions();
        } else {
          const e = await res.json();
          alert('Erro ao excluir: ' + (e.error || e.message));
        }
      });
    });

    document.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const form = document.getElementById('edit-form-' + btn.dataset.id);
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
      });
    });

    document.querySelectorAll('.save-edit-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        const id = btn.dataset.id;
        const text = document.getElementById('ef-text-' + id).value.trim();
        const category = document.getElementById('ef-cat-' + id).value.trim();
        const weight = parseInt(document.getElementById('ef-weight-' + id).value);
        const timeLimitSeconds = parseInt(document.getElementById('ef-time-' + id).value);

        const altContainer = document.getElementById('ef-alts-' + id);
        const altTexts = altContainer.querySelectorAll('.ef-alt-text');
        const altCorrects = altContainer.querySelectorAll('.ef-alt-correct');
        const alternatives = [];
        altTexts.forEach(function(input, i) {
          if (input.value.trim()) {
            alternatives.push({ text: input.value.trim(), isCorrect: altCorrects[i].checked });
          }
        });

        if (!text) { alert('Enunciado é obrigatório'); return; }
        if (alternatives.length < 2) { alert('Mínimo de 2 alternativas'); return; }
        if (!alternatives.some(function(a) { return a.isCorrect; })) { alert('Marque qual alternativa é a correta'); return; }

        try {
          const res = await fetch(API + '/admin/questions/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() },
            body: JSON.stringify({ text: text, category: category || null, weight: weight, timeLimitSeconds: timeLimitSeconds, alternatives: alternatives }),
          });
          if (res.ok) {
            alert('✅ Pergunta atualizada!');
            await loadAdminQuestions();
          } else {
            const e = await res.json();
            alert('Erro: ' + (e.error || e.message));
          }
        } catch (e) { alert('Erro: ' + e.message); }
      });
    });

    document.querySelectorAll('.cancel-edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.getElementById('edit-form-' + btn.dataset.id).style.display = 'none';
      });
    });

  } catch (e) { alert('Erro: ' + e.message); }
}

async function createQuestion() {
  const text = document.getElementById('question-text').value.trim();
  const category = document.getElementById('question-category').value.trim();
  const weight = parseInt(document.getElementById('question-weight').value) || 10;
  const timeLimitSeconds = parseInt(document.getElementById('question-time').value) || 30;

  const altTexts = document.querySelectorAll('.alt-text');
  const altCorrects = document.querySelectorAll('.alt-correct');
  const alternatives = [];
  for (let i = 0; i < altTexts.length; i++) {
    if (altTexts[i].value.trim()) {
      alternatives.push({ text: altTexts[i].value.trim(), isCorrect: altCorrects[i].checked });
    }
  }

  if (!text) { alert('Enunciado é obrigatório'); return; }
  if (alternatives.length < 2) { alert('Adicione pelo menos 2 alternativas'); return; }
  if (!alternatives.some(function(a) { return a.isCorrect; })) { alert('Marque a alternativa correta'); return; }

  try {
    const res = await fetch(API + '/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() },
      body: JSON.stringify({ text: text, category: category || null, weight: weight, timeLimitSeconds: timeLimitSeconds, quizId: 'global', alternatives: alternatives }),
    });
    if (res.ok) {
      alert('✅ Pergunta criada!');
      document.getElementById('question-text').value = '';
      document.getElementById('question-category').value = '';
      document.querySelectorAll('.alt-text').forEach(function(i) { i.value = ''; });
      document.querySelectorAll('.alt-correct').forEach(function(i) { i.checked = false; });
      await loadAdminCategories();
    } else {
      const e = await res.json();
      alert('Erro: ' + (e.error || e.message || JSON.stringify(e)));
    }
  } catch (e) { alert('Erro: ' + e.message); }
}

// ── Tabs ────────────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('#user-section .tab-content').forEach(function(t) { t.classList.remove('active'); });
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
  document.querySelectorAll('.admin-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.admin-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('#admin-section .tab-content').forEach(function(t) { t.classList.remove('active'); });
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  document.getElementById('quiz-mode').addEventListener('change', function(e) {
    document.getElementById('quiz-category').style.display = e.target.value === 'global_category' ? 'block' : 'none';
  });
}

async function logout() {
  await clerk.signOut();
  location.reload();
}

// ── Listeners ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  function tryInitClerk() {
    if (window.Clerk) {
      initClerk();
    } else {
      setTimeout(tryInitClerk, 100);
    }
  }
  tryInitClerk();
  initTabs();

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('sync-user-btn').addEventListener('click', syncUser);
  document.getElementById('get-questions-btn').addEventListener('click', startQuiz);
  document.getElementById('ranking-btn').addEventListener('click', showRanking);
  document.getElementById('list-questions-btn').addEventListener('click', loadAdminQuestions);
  document.getElementById('create-question-btn').addEventListener('click', createQuestion);
});