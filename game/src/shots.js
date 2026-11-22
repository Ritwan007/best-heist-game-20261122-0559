// The Gilded Gallery — staged moments for the maker's screenshots.
// One job: given ?shot=<name>, pose the live game into a chosen moment and
// freeze it, so each screenshot is a real render of this code, held still.
// The four moments: the job begins, mid-heist, caught, and the getaway.
export function applyShot(state, shot, helpers) {
  const { freshLevel, DIAMOND_VALUE } = helpers;
  if (shot === 'start') {
    state.screen = 'playing';
    state.frozen = true;
    return;
  }
  if (shot === 'cover') {
    // Mid-heist: Wren slips between the cases, one guard's cone sweeping
    // toward her, the camera turning, the Diamond glowing, alarm halfway up.
    state.screen = 'playing';
    state.player.x = 560;
    state.player.y = 500;
    state.player.facing = -2.2;
    state.player.sneaking = true;
    state.loot[0].taken = true;
    state.loot[4].taken = true;
    state.lootTotal = 650;
    state.alarm = 48;
    state.timeLeft = 143;
    state.smokeCount = 1;
    const g0 = state.guards[0];
    g0.x = 700;
    g0.y = 300;
    g0.facing = 2.18;
    g0.walkFacing = 2.18;
    g0.state = 'pause';
    g0.pauseLeft = 1.0;
    g0.spot = 0.4;
    const g1 = state.guards[1];
    g1.x = 500;
    g1.y = 640;
    g1.facing = -Math.PI / 2;
    g1.walkFacing = -Math.PI / 2;
    g1.state = 'patrol';
    state.cameras[0].angle = Math.PI / 2 + 0.45;
    state.message = 'The patrol turns — move now';
    state.messageLeft = 999;
    state.frozen = true;
    return;
  }
  if (shot === 'caught') {
    // The fair caught moment: alarm at 100, a guard a step away, caught.
    state.screen = 'playing';
    state.player.x = 640;
    state.player.y = 420;
    state.player.facing = Math.PI / 2;
    state.alarm = 100;
    state.lockdownLeft = 2;
    state.lootTotal = 900;
    state.timeLeft = 96;
    const g0 = state.guards[0];
    g0.x = 668;
    g0.y = 428;
    g0.facing = Math.atan2(420 - 428, 640 - 668);
    g0.walkFacing = g0.facing;
    g0.state = 'chase';
    g0.spot = 1;
    state.caughtReason = 'A guard grabbed you under the gallery lights.';
    state.frozen = true;
    // Step the screen to caught after one render so the room is visible
    // behind the overlay: the overlay itself is the moment.
    setTimeout(() => { state.screen = 'caught'; }, 60);
    return;
  }
  if (shot === 'getaway') {
    // The payoff: all three rooms behind her, Diamond in hand, out the door.
    const third = freshLevel(2);
    Object.assign(state, third);
    state.screen = 'won';
    state.lootTotal = 4350;
    state.heistTimeText = '9:41';
    state.diamondTaken = true;
    state.alarm = 12;
    state.timeLeft = 88;
    state.player.x = 640;
    state.player.y = 716;
    state.frozen = true;
    return;
  }
  // Unknown shot name: leave the title screen alone.
  state.frozen = true;
}
