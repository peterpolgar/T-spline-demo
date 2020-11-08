const s = ( p ) => {

  let rad = 16, rad2 = rad * rad / 4, pontok = new Array(numpoints * 4);
  let slen = abs_s[abs_s.length - 3] - abs_s[2];
  let tlen = abs_t[abs_t.length - 3] - abs_t[2];
  let swi, she, dwi, dhe, torw, torh, thp2, twp2;

  p.setup = function() {
    p.createCanvas(coffh, coffh);
    swi = p.width * 0.13; she = p.height * 0.13; dwi = p.width * 0.75; dhe = p.height * 0.75;
    torw = dwi / 16; torh = dhe / 16; thp2 = torh / 2; twp2 = torw / 2;
    p.noLoop();
  };

  p.draw = function() {
    p.background(240, 240, 240);
    p.strokeWeight(2);
    let cnt = 0;
    // horizontal
    for ( let i = 0; i < s_points_dy.length; ++i ) {
      let y1 = p.height - (she + ((abs_t[i + 2] - abs_t[2]) / tlen) * dhe), y2 = y1;
      for ( let j = 0; j < s_points_dy[i].length - 1; ++j ) {
        if ( s_points_dy[i][j] ) {
          let x1 = swi + ((abs_s[s_tmesh[i + 2][j + 2]] - abs_s[2]) / slen) * dwi;
          let x2 = swi + ((abs_s[s_tmesh[i + 2][j + 3]] - abs_s[2]) / slen) * dwi;
          p.line(x1, y1, x2, y2);
          pontok[cnt] = x1;
          pontok[cnt + 1] = y1;
          pontok[cnt + 2] = i;
          pontok[cnt + 3] = j * 10;
          cnt += 4;
        }
      }
      let zz = s_points_dy[i].length - 1;
      pontok[cnt] = swi + ((abs_s[s_tmesh[i + 2][zz + 2]] - abs_s[2]) / slen) * dwi;
      pontok[cnt + 1] = y1;
      pontok[cnt + 2] = i;
      pontok[cnt + 3] = zz * 10;
      cnt += 4;
    }
    p.fill(100, 225, 100);
    // vertical
    for ( let i = 0; i < t_points_dy.length; ++i ) {
      let x1 = swi + ((abs_s[i + 2] - abs_s[2]) / slen) * dwi, x2 = x1;
      for ( let j = 0; j < t_points_dy[i].length - 1; ++j ) {
        if ( t_points_dy[i][j] ) {
          let y1 = p.height - (she + ((abs_t[t_tmesh[i + 2][j + 2]] - abs_t[2]) / tlen) * dhe);
          let y2 = p.height - (she + ((abs_t[t_tmesh[i + 2][j + 3]] - abs_t[2]) / tlen) * dhe);
          p.line(x1, y1, x2, y2);
          p.circle(x1, y1, rad);
          p.circle(x2, y2, rad);
        }
      }
    }
    
    // left
    let x1 = swi, x2 = x1 - torw;
    for ( let j = 0; j < t_points_dy[0].length; ++j ) {
      let y1 = p.height - (she + ((abs_t[t_tmesh[2][j + 2]] - abs_t[2]) / tlen) * dhe), y2 = y1;
      p.line(x1, y1, x2, y2);
      p.circle(x1, y1, rad);
    }
    // right
    let ut = t_points_dy.length - 1;
    x1 = swi + ((abs_s[ut + 2] - abs_s[2]) / slen) * dwi; x2 = x1 + torw;
    for ( let j = 0; j < t_points_dy[ut].length; ++j ) {
      let y1 = p.height - (she + ((abs_t[t_tmesh[ut + 2][j + 2]] - abs_t[2]) / tlen) * dhe), y2 = y1;
      p.line(x1, y1, x2, y2);
      p.circle(x1, y1, rad);
    }
    // down
    let y1 = p.height - she, y2 = y1 + torh;
    for ( let j = 0; j < s_points_dy[0].length; ++j ) {
      let x1 = swi + ((abs_s[s_tmesh[2][j + 2]] - abs_s[2]) / slen) * dwi, x2 = x1;
      p.line(x1, y1, x2, y2);
      p.circle(x1, y1, rad);
    }
    // up
    ut = s_points_dy.length - 1;
    y1 = p.height - (she + ((abs_t[ut + 2] - abs_t[2]) / tlen) * dhe);  y2 = y1 - torh;
    for ( let j = 0; j < s_points_dy[ut].length; ++j ) {
      let x1 = swi + ((abs_s[s_tmesh[ut + 2][j + 2]] - abs_s[2]) / slen) * dwi, x2 = x1;
      p.line(x1, y1, x2, y2);
      p.circle(x1, y1, rad);
    }
    
    // axes
    p.fill(0);
    // p.textFont(inconsolata);
    p.textSize(p.width * 0.04);
    p.textAlign(p.CENTER, p.CENTER);
    let ww = 0.05, wh = 1 - ww, tri = p.width * 0.015;
    // t axis
    p.stroke(0);
    p.line(p.width * ww, p.height * wh, p.width * ww, p.height * ww);
    p.noStroke();
    p.triangle(p.width * ww - tri, p.height * ww, p.width * ww + tri, p.height * ww, p.width * ww, p.height * ww - 2 * tri);
    p.text('t', ww * 0.5 * p.width, p.height / 2);
    // s axis
    p.stroke(0);
    p.line(p.width * ww, p.height * wh, p.width * wh, p.height * wh);
    p.noStroke();
    p.triangle(p.width * wh, p.height * wh - tri, p.width * wh, p.height * wh + tri, p.width * wh + 2 * tri, p.height * wh );
    p.text('s', p.width / 2, (wh + ww * 0.5) * p.height );
    p.textSize(p.width * 0.03);
    p.text('View knot vectors: move the mouse above the selected point', p.width / 2, ww * 0.5 * p.height );
  };
  
  function distance(px, py, mx, my) {
      let dx = px - mx,
          dy = py - my;
      return dx * dx + dy * dy;
  }

  let volt = false;
  p.mouseMoved = function() {
      // if ( mouseX <= mousexmax && mouseY > mouseymin ) {
          let van = false;
          for ( var i = 0; i < pontok.length; i += 4 ) {
              if ( distance( pontok[i], pontok[i + 1], p.mouseX, p.mouseY) <= rad2 ) {
                if( !volt ){
                  // s vec
                  p.strokeWeight(4);
                  // p.stroke(230, 173, 38);
                  p.stroke(50, 50, 255);
                  let tmp = swi + ((knot_vecs[pontok[i + 2]][pontok[i + 3]] - abs_s[2]) / slen) * dwi;
                  p.line(pontok[i], pontok[i + 1], tmp, pontok[i + 1]);
                  p.line(tmp, pontok[i + 1] - thp2, tmp, pontok[i + 1] + thp2);
                  tmp = swi + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 1] - abs_s[2]) / slen) * dwi;
                  p.line(tmp, pontok[i + 1] - thp2, tmp, pontok[i + 1] + thp2);
                  tmp = swi + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 3] - abs_s[2]) / slen) * dwi;
                  p.line(tmp, pontok[i + 1] - thp2, tmp, pontok[i + 1] + thp2);
                  tmp = swi + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 4] - abs_s[2]) / slen) * dwi;
                  p.line(tmp, pontok[i + 1] - thp2, tmp, pontok[i + 1] + thp2);
                  p.line(pontok[i], pontok[i + 1], tmp, pontok[i + 1]);

                  // t vec
                  p.stroke(206, 42, 42);
                  tmp = p.height - (she + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 5] - abs_t[2]) / tlen) * dhe);
                  p.line(pontok[i], pontok[i + 1], pontok[i], tmp);
                  p.line(pontok[i] - twp2, tmp, pontok[i] + twp2, tmp);
                  tmp = p.height - (she + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 6] - abs_t[2]) / tlen) * dhe);
                  p.line(pontok[i] - twp2, tmp, pontok[i] + twp2, tmp);
                  tmp = p.height - (she + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 8] - abs_t[2]) / tlen) * dhe);
                  p.line(pontok[i] - twp2, tmp, pontok[i] + twp2, tmp);
                  tmp = p.height - (she + ((knot_vecs[pontok[i + 2]][pontok[i + 3] + 9] - abs_t[2]) / tlen) * dhe);
                  p.line(pontok[i] - twp2, tmp, pontok[i] + twp2, tmp);
                  p.line(pontok[i], pontok[i + 1], pontok[i], tmp);
                  
                  p.fill(255, 0, 255);
                  p.circle(pontok[i], pontok[i + 1], rad);
                  volt = true;
                }
                van = true;
                break;
              }
          }
          if ( volt && !van ) {
            p.strokeWeight(2);
            p.stroke(0);
            p.redraw();
            volt = false;
          }
      // }
  };
};

let myp5 = new p5(s, 'mesh');