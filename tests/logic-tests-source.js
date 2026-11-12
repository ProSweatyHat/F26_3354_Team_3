  async function freshSetup() {
    var users = [{ username: DEMO.username, hash: await hashPassword(DEMO.password) }];
    var time = 1000000;
    var clock = {
      now: function () { return time; },
      advance: function (ms) { time = time + ms; }
    };
    var testAuth = createAuth(users, { maxAttempts: 3, lockMs: 30000, now: clock.now });
    var testStore = createContentStore(testAuth, SEED, null);
    return { users: users, clock: clock, auth: testAuth, store: testStore };
  }

  async function signedInSetup() {
    var s = await freshSetup();
    await s.auth.login(DEMO.username, DEMO.password);
    return s;
  }

  function sessionText(authed) {
    if (authed) { return 'session started'; }
    return 'no session';
  }

  var TESTS = [
    {
      id: 'TC-A1', group: 'Authentication',
      name: 'Valid credentials sign the admin in',
      input: 'admin / Admin#2026',
      expected: 'Login succeeds, session started',
      run: async function () {
        var s = await freshSetup();
        var r = await s.auth.login(DEMO.username, DEMO.password);
        var authed = s.auth.isAuthed();
        return { pass: r.ok === true && authed === true, actual: 'Code ' + r.code + ', ' + sessionText(authed) };
      }
    },
    {
      id: 'TC-A2', group: 'Authentication',
      name: 'Wrong password is rejected',
      input: 'admin / wrong-pass',
      expected: 'BAD_CREDENTIALS, no session',
      run: async function () {
        var s = await freshSetup();
        var r = await s.auth.login(DEMO.username, 'wrong-pass');
        var authed = s.auth.isAuthed();
        return { pass: r.ok === false && r.code === 'BAD_CREDENTIALS' && authed === false, actual: r.code + ', ' + sessionText(authed) };
      }
    },
    {
      id: 'TC-A3', group: 'Authentication',
      name: 'Unknown user gets the same error as a wrong password',
      input: 'nobody / wrong-pass vs admin / wrong-pass',
      expected: 'Both return the same message',
      run: async function () {
        var s = await freshSetup();
        var unknownUser = await s.auth.login('nobody', 'wrong-pass');
        var wrongPassword = await s.auth.login(DEMO.username, 'wrong-pass');
        var same = (unknownUser.message === wrongPassword.message) && (unknownUser.code === wrongPassword.code);
        var text = 'Messages match';
        if (!same) { text = 'Messages differ'; }
        return { pass: same, actual: text };
      }
    },
    {
      id: 'TC-A4', group: 'Authentication',
      name: 'Empty username and password are rejected',
      input: '(empty) / (empty)',
      expected: 'EMPTY_FIELDS, no session',
      run: async function () {
        var s = await freshSetup();
        var r = await s.auth.login('', '');
        var authed = s.auth.isAuthed();
        return { pass: r.code === 'EMPTY_FIELDS' && authed === false, actual: r.code + ', ' + sessionText(authed) };
      }
    },
    {
      id: 'TC-A5', group: 'Authentication',
      name: 'Account locks after 3 failed attempts',
      input: '3 wrong passwords, then the correct one',
      expected: 'BAD_CREDENTIALS, BAD_CREDENTIALS, LOCKED, LOCKED',
      run: async function () {
        var s = await freshSetup();
        var codes = [];
        for (var i = 0; i < 3; i++) {
          var wrong = await s.auth.login(DEMO.username, 'wrong-pass');
          codes.push(wrong.code);
        }
        var correct = await s.auth.login(DEMO.username, DEMO.password);
        codes.push(correct.code);
        var actual = codes.join(', ');
        return { pass: actual === 'BAD_CREDENTIALS, BAD_CREDENTIALS, LOCKED, LOCKED' && s.auth.isAuthed() === false, actual: actual };
      }
    },
    {
      id: 'TC-A6', group: 'Authentication',
      name: 'Lock ends after 30 seconds',
      input: 'Locked account, correct password at +29 s and +31 s',
      expected: 'LOCKED at +29 s, then OK at +31 s',
      run: async function () {
        var s = await freshSetup();
        for (var i = 0; i < 3; i++) {
          await s.auth.login(DEMO.username, 'wrong-pass');
        }
        s.clock.advance(29000);
        var early = await s.auth.login(DEMO.username, DEMO.password);
        s.clock.advance(2000);
        var late = await s.auth.login(DEMO.username, DEMO.password);
        return { pass: early.code === 'LOCKED' && late.code === 'OK', actual: early.code + ' at +29 s, then ' + late.code + ' at +31 s' };
      }
    },
    {
      id: 'TC-A7', group: 'Authentication',
      name: 'Logout ends the session',
      input: 'Sign in, then log out',
      expected: 'Session active, then no session',
      run: async function () {
        var s = await signedInSetup();
        var before = s.auth.isAuthed();
        s.auth.logout();
        var after = s.auth.isAuthed();
        return { pass: before === true && after === false, actual: sessionText(before) + ', then ' + sessionText(after) };
      }
    },
    {
      id: 'TC-A8', group: 'Authentication',
      name: 'Runtime account record contains a password hash',
      input: 'Stored value for the admin account',
      expected: 'Runtime hash differs from password; demo credentials remain in source',
      run: async function () {
        var s = await freshSetup();
        var stored = s.users[0].hash;
        var plain = (stored === DEMO.password) || (stored.indexOf(DEMO.password) !== -1);
        var text = 'Stored as ' + stored.split(':')[0] + ' hash';
        if (plain) { text = 'Plain text found'; }
        return { pass: plain === false, actual: text };
      }
    },
    {
      id: 'TC-A9', group: 'Authentication',
      name: 'Dashboard link redirects to login when signed out',
      input: 'Open #admin signed out, then signed in',
      expected: 'login, then admin',
      run: async function () {
        var signedOut = resolveRoute('admin', false);
        var signedIn = resolveRoute('admin', true);
        return { pass: signedOut === 'login' && signedIn === 'admin', actual: signedOut + ', then ' + signedIn };
      }
    },
    {
      id: 'TC-C1', group: 'Content management',
      name: 'Admin can add content',
      input: 'Title "Demo day", valid message, type Event',
      expected: 'Item count goes from 3 to 4, new item listed first',
      run: async function () {
        var s = await signedInSetup();
        var before = s.store.list().length;
        var r = s.store.add({ title: 'Demo day', body: 'Recording starts at 3 pm.', tag: 'Event' });
        var list = s.store.list();
        var pass = r.ok === true && list.length === before + 1 && list[0].title === 'Demo day';
        return { pass: pass, actual: 'Item count ' + before + ' to ' + list.length + ', first item "' + list[0].title + '"' };
      }
    },
    {
      id: 'TC-C2', group: 'Content management',
      name: 'Add is rejected when the title is empty',
      input: 'Title "   ", valid message',
      expected: 'INVALID, count stays 3',
      run: async function () {
        var s = await signedInSetup();
        var r = s.store.add({ title: '   ', body: 'Some message', tag: 'Update' });
        var count = s.store.list().length;
        return { pass: r.code === 'INVALID' && count === 3, actual: r.code + ', count ' + count };
      }
    },
    {
      id: 'TC-C3', group: 'Content management',
      name: 'Add is rejected when the title is over 80 characters',
      input: 'Title of 81 characters',
      expected: 'INVALID, count stays 3',
      run: async function () {
        var s = await signedInSetup();
        var longTitle = new Array(82).join('a');
        var r = s.store.add({ title: longTitle, body: 'Some message', tag: 'Update' });
        var count = s.store.list().length;
        return { pass: r.code === 'INVALID' && count === 3, actual: r.code + ', count ' + count };
      }
    },
    {
      id: 'TC-C4', group: 'Content management',
      name: 'Admin can edit existing content',
      input: 'Item 1, new title "Report due Thursday"',
      expected: 'OK, item 1 shows the new title',
      run: async function () {
        var s = await signedInSetup();
        var r = s.store.edit(1, { title: 'Report due Thursday', body: 'Updated message.', tag: 'Update' });
        var found = null;
        var list = s.store.list();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === 1) { found = list[i]; }
        }
        var title = 'not found';
        if (found) { title = found.title; }
        return { pass: r.ok === true && title === 'Report due Thursday', actual: r.code + ', title "' + title + '"' };
      }
    },
    {
      id: 'TC-C5', group: 'Content management',
      name: 'Editing an item that does not exist fails',
      input: 'Item 9999',
      expected: 'NOT_FOUND',
      run: async function () {
        var s = await signedInSetup();
        var r = s.store.edit(9999, { title: 'Ghost', body: 'Nothing here', tag: 'Update' });
        return { pass: r.code === 'NOT_FOUND', actual: r.code };
      }
    },
    {
      id: 'TC-C6', group: 'Content management',
      name: 'Admin can delete content',
      input: 'Item 2',
      expected: 'OK, count goes from 3 to 2, item 2 gone',
      run: async function () {
        var s = await signedInSetup();
        var r = s.store.remove(2);
        var list = s.store.list();
        var stillThere = false;
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === 2) { stillThere = true; }
        }
        return { pass: r.ok === true && list.length === 2 && stillThere === false, actual: r.code + ', count ' + list.length };
      }
    },
    {
      id: 'TC-C7', group: 'Content management',
      name: 'Deleting an item that does not exist fails',
      input: 'Item 9999',
      expected: 'NOT_FOUND, count stays 3',
      run: async function () {
        var s = await signedInSetup();
        var r = s.store.remove(9999);
        var count = s.store.list().length;
        return { pass: r.code === 'NOT_FOUND' && count === 3, actual: r.code + ', count ' + count };
      }
    },
    {
      id: 'TC-C8', group: 'Content management',
      name: 'Add, edit and delete are blocked when signed out',
      input: 'Add, edit item 1 and delete item 1 with no session',
      expected: 'UNAUTHORIZED three times, count stays 3',
      run: async function () {
        var s = await freshSetup();
        var a = s.store.add({ title: 'Sneaky', body: 'Should not work', tag: 'Update' });
        var e = s.store.edit(1, { title: 'Changed', body: 'Should not work', tag: 'Update' });
        var d = s.store.remove(1);
        var count = s.store.list().length;
        var allBlocked = a.code === 'UNAUTHORIZED' && e.code === 'UNAUTHORIZED' && d.code === 'UNAUTHORIZED';
        return { pass: allBlocked && count === 3, actual: a.code + ', ' + e.code + ', ' + d.code + ', count ' + count };
      }
    },
    {
      id: 'TC-C9', group: 'Content management',
      name: 'HTML in a title is escaped before it is shown',
      input: '<script>alert(1)<\/script>',
      expected: 'No raw < or > in the rendered text',
      run: async function () {
        var out = escapeHtml('<script>alert(1)<\/script>');
        var safe = out.indexOf('<') === -1 && out.indexOf('>') === -1;
        return { pass: safe, actual: out };
      }
    }
  ];

