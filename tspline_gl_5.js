// common variables of the u, v curves
var w_arr, points, pointsize_arr, mouseymin, mousexmax, on_point;

var degree, s_tmesh, t_tmesh, numpoints = 34, knot_vecs, sfContainer, knotTContainer, knotTst, knotSContainer, knotSst, t_step, s_step, t_min, t_max, s_min, s_max, t_points_dy, s_points_dy, t_vec, s_vec, abs_s, abs_t, tcrawl;

var scp_arr, cam, zunit, FELB, knotFelb, puff_arr, sugar, szog1, szog2, drawcn, drawcp, drawkp, drawdm, notPopup, entered_pop, dmx, dmy, shift_x, shift_y, shift_z, point_changed;

var coffh = (document.getElementById('cvas').offsetHeight - 4) * 0.9, no_tmesh;
var knot_net_s_display_array, knot_net_t_display_array, surface_display_points;

// calculate nurbs weight for a given controllpoint and parameter (t)
function nurbs_weight(t, U) {
    // arr will contain the values of the weight functions at different levels
    // first, calculate the values of the level zero weight functions
    var arr = [0, 0, 0, 0];
    // at level zero find the knot range that return 1 for the parameter value t
    for ( var x = degree; x >= 0; --x ) {
        if ( t >= U[x] ) {
            // if knot range is invalid then return 0 (to eliminate NaN return value)
            if ( U[x] == U[x + 1] ) {
                return 0;
            }
            arr[x] = 1;
            break;
        }
    }
    // compute the values of the weight functions from level one to level p (degree)
    var level = 1;
    // on level one there are p (degree) weight functions, the next level with one less, and so on...
    for ( x = degree; x >= 1; --x ) {
        // at the given level compute all values of weight functions
        for ( var y = 0; y < x; ++y ) {
            if ( arr[y] != 0 ) {
                arr[y] = ((t - U[y]) / (U[y + level] - U[y])) * arr[y];
            }
            if ( arr[y + 1] != 0 ) {
                arr[y] += ((U[y + level + 1] - t) / (U[y + level + 1] - U[y + 1])) * arr[y + 1];
            }
        }
        ++level;
    }
    // arr[0] is the value of the N(idx, p)(t) from the formula
    return arr[0];
}

function init_tmesh() {
    // t-mesh definition from s, t directions
    t_tmesh = [
                 [0, 1, 2, 3,   4,   5,   6,  7,  8,   9,  10],
                 [0, 1, 2, 3,   4,   5,   6,  7,  8,   9,  10],
                 
                 [0, 1, 2, 3,   4,   5,  6,  8,  9, 10],
                 [0, 1, 2, 3,   9,   10],
                 [0, 1, 3, 4,   9,   10],
                 [0, 1, 5, 6,   8,   9, 10],
                 [0, 1, 2, 3,   4,   5,  9,  10],
                 [0, 1, 2, 3,   5,   7,  8,  9, 10],
                 [0, 1, 3, 5,   9,   10],
                 [0, 1, 2, 3,   5,   7,  8,  9, 10],
                 [0, 1, 2, 3,   5,   7,  8,  9, 10],
                 
                 [0, 1, 2, 3,   4,   5,   6,  7,  8,   9,  10],
                 [0, 1, 2, 3,   4,   5,   6,  7,  8,   9,  10]
              ];
    s_tmesh = [
                 [0, 1, 2, 3,   4,  5,  6,  7,  8,  9,  10, 11, 12],
                 [0, 1, 2, 3,   4,  5,  6,  7,  8,  9,  10, 11, 12],
                 
                 [0, 1, 2, 3,   6,   7,  9,  10,  11, 12],
                 [0, 1, 2, 3,   4,   6,  7,  8,  9,  10,  11, 12],
                 [0, 1, 2, 4,   6,   11, 12],
                 [0, 1, 2, 5,   6,   7,  8,  9,  10,  11, 12],
                 [0, 1, 2, 5,   11,  12],
                 [0, 1, 7, 9,   10,   11, 12],
                 [0, 1, 2, 5,   7,   9,  10,  11, 12],
                 
                 [0, 1, 2, 3,   4,  5,  6,  7,  8,  9,  10, 11, 12],
                 [0, 1, 2, 3,   4,  5,  6,  7,  8,  9,  10, 11, 12]
              ];

    abs_s = [1, 1, 2, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 10], abs_t = [1, 1, 2, 4, 5, 6, 7, 8, 9, 10, 10];
      
    // right direction
    s_points_dy = [
                    [true,    true,   true,   true,   true,   true],
                    [true,    true,   true,   true,   true,   true,   true,   true],
                    [true,    true,   false],
                    [true,    true,   true,   true,   true,   true,   true],
                    [true,    false],
                    [true,    true,   true],
                    [true,    true,   true,   true,   true]
                  ];
    // up direction
    t_points_dy = [
                     [true,    true,   true,   true,   true,   true],
                     [true,    false],
                     [true,    false],
                     [true,    true,   true],
                     [true,    true,   true,   false],
                     [true,    true,   true,   true,   true],
                     [true,    false],
                     [true,    true,   true,   true,   true],
                     [true,    true,   true,   true,   true]
                  ];

    // for every point: defining first s, then t knot vector
    knot_vecs = new Array(abs_t.length - 4);
    for ( let g = 2; g < s_tmesh.length - 2; ++g ) {
        let i = g - 2;
        knot_vecs[i] = new Array(10 * (s_tmesh[g].length - 4));
        for ( let h = 2 ; h < s_tmesh[g].length - 2; ++h ) {
            let j = h - 2;
            // s knot vector filling
            // middle element
            knot_vecs[i][j * 10 + 2] = abs_s[s_tmesh[g][h]];
            
            // left side
            let count = 0;
            for ( let x = s_tmesh[g][h] - 1; x >= 0; --x ) {
                for ( let k = 2; k < t_tmesh[x].length - 2; ++k ) {
                    if ( abs_t[t_tmesh[x][k]] == abs_t[g] ) {
                        ++count;
                        knot_vecs[i][j * 10 + 2 - count] = abs_s[x];
                        break;
                    }else if( abs_t[t_tmesh[x][k]] > abs_t[g] ){
                        if ( k > 2 && t_points_dy[x - 2][k - 3] ) {
                            ++count;
                            knot_vecs[i][j * 10 + 2 - count] = abs_s[x];
                        }
                        break;
                    }
                }
                if ( count == 2 ) {
                    break;
                }
            }
            
            // right side
            count = 0;
            for ( let x = s_tmesh[g][h] + 1; x < abs_s.length; ++x ) {
                for ( let k = 2; k < t_tmesh[x].length - 2; ++k ) {
                    if ( abs_t[t_tmesh[x][k]] == abs_t[g] ) {
                        ++count;
                        knot_vecs[i][j * 10 + 2 + count] = abs_s[x];
                        break;
                    }else if( abs_t[t_tmesh[x][k]] > abs_t[g] ){
                        if ( k > 2 && t_points_dy[x - 2][k - 3] ) {
                            ++count;
                            knot_vecs[i][j * 10 + 2 + count] = abs_s[x];
                        }
                        break;
                    }
                }
                if ( count == 2 ) {
                    break;
                }
            }
            
            // t knot vector filling
            // middle element
            knot_vecs[i][j * 10 + 7] = abs_t[g];
            
            // down side
            count = 0;
            for ( let x = g - 1; x >= 0; --x ) {
                for ( let k = 2; k < s_tmesh[x].length - 2; ++k ) {
                    if ( abs_s[s_tmesh[x][k]] == abs_s[s_tmesh[g][h]] ) {
                        ++count;
                        knot_vecs[i][j * 10 + 7 - count] = abs_t[x];
                        break;
                    }else if( abs_s[s_tmesh[x][k]] > abs_s[s_tmesh[g][h]] ){
                        if ( k > 2 && s_points_dy[x - 2][k - 3] ) {
                            ++count;
                            knot_vecs[i][j * 10 + 7 - count] = abs_t[x];
                        }
                        break;
                    }
                }
                if ( count == 2 ) {
                    break;
                }
            }
            
            // up side
            count = 0;
            for ( let x = g + 1; x < abs_t.length; ++x ) {
                for ( let k = 2; k < s_tmesh[x].length - 2; ++k ) {
                    if ( abs_s[s_tmesh[x][k]] == abs_s[s_tmesh[g][h]] ) {
                        ++count;
                        knot_vecs[i][j * 10 + 7 + count] = abs_t[x];
                        break;
                    }else if( abs_s[s_tmesh[x][k]] > abs_s[s_tmesh[g][h]] ){
                        if ( k > 2 && s_points_dy[x - 2][k - 3] ) {
                            ++count;
                            knot_vecs[i][j * 10 + 7 + count] = abs_t[x];
                        }
                        break;
                    }
                }
                if ( count == 2 ) {
                    break;
                }
            }
        }
    }
    
    // check knot vectors
    // for ( let g = 0; g < knot_vecs.length; ++g ) {
    //     for ( let h = 0; h < knot_vecs[g].length; h += 10 ) {
    //         console.log('point s:', knot_vecs[g][h + 2], ', t:', knot_vecs[g][h + 7]);
    //         console.log('\ts: [', knot_vecs[g][h], knot_vecs[g][h + 1], knot_vecs[g][h + 2], knot_vecs[g][h + 3], knot_vecs[g][h + 4], ']' );
    //         console.log('\tt: [', knot_vecs[g][h + 5], knot_vecs[g][h + 6], knot_vecs[g][h + 7], knot_vecs[g][h + 8], knot_vecs[g][h + 9], ']' );
    //     }
    // }
    let sumv = new Array(s_points_dy.length);
    sumv[0] = 0;
    for ( let i = 0; i < s_points_dy.length - 1; ++i ) {
        sumv[i + 1] = s_points_dy[i].length + sumv[i];
    }

    tcrawl = new Array(t_points_dy.length);
    for ( let i = 0; i < t_points_dy.length; ++i ) {
        tcrawl[i] = new Array(t_points_dy[i].length);
        for ( let j = 0; j < t_points_dy[i].length; ++j ) {
            tcrawl[i][j] = sumv[t_tmesh[i + 2][j + 2] - 2] + s_tmesh[t_tmesh[i + 2][j + 2]].indexOf(i + 2) - 2;
        }
    }
}
init_tmesh();

// Allows for the friendly error system (FES) to be turned off when creating a sketch, which can give a significant boost to performance when needed.
// p5.disableFriendlyErrors = true;

function setup() {
    setAttributes('antialias', true);

    // assignments of parameters
    degree = 3; numpoints = 34;
    // control points weigths array
    w_arr = new Array(numpoints).fill(1);
    // control points draw sizes
    pointsize_arr = new Array(numpoints).fill(1);
    
    s_min = abs_s[2];
    s_max = abs_s[abs_s.length - 3];
    t_min = abs_t[2];
    t_max = abs_t[abs_t.length - 3];
    // set the resolution
    knotFelb = 15;
    FELB = 33;
    // split the curve to FELB parts
    s_step = (s_max - s_min) / FELB;
    t_step = (t_max - t_min) / FELB;
    // fill the t and s vectors
    t_vec = new Array(FELB + 1); s_vec = new Array(FELB + 1);
    for ( let k = 0; k <= FELB; ++k ) {
        t_vec[k] = t_min + k * t_step;
        s_vec[k] = s_min + k * s_step;
    }
    // allock puffer array
    puff_arr = new Array((FELB + 1) * 3);
    // full window canvas creation on the webpage
    var canvasDiv = document.getElementById('cvas');
    let myCanvas = createCanvas(canvasDiv.offsetWidth, canvasDiv.offsetHeight - 4, WEBGL);
    myCanvas.parent('cvas');
    cam = createCamera();
    // for mouse events
    addScreenPositionFunction();
    // toenforce mouse event within canvas
    mousexmax = windowWidth - document.getElementById('two').offsetWidth;
    mouseymin = document.getElementById('leiras').offsetHeight;
    
    // define the controllpoints
    zunit = width * 0.875 / 6;
    points = [
                0.15 * width, 0.15 * height, 3 * zunit,
                0.25 * width, 0.15 * height, 3 * zunit,
                0.45 * width, 0.15 * height, 3 * zunit,
                0.55 * width, 0.15 * height, 3 * zunit,
                0.75 * width, 0.15 * height, 3 * zunit,
                0.85 * width, 0.15 * height, 3 * zunit,
                
                0.15 * width, 0.50 * height, 2 * zunit,
                0.25 * width, 0.50 * height, 2 * zunit,
                0.30 * width, 0.50 * height, 2 * zunit,
                0.45 * width, 0.50 * height, 2 * zunit,
                0.55 * width, 0.50 * height, 2 * zunit,
                0.65 * width, 0.50 * height, 2 * zunit,
                0.75 * width, 0.50 * height, 2 * zunit,
                0.85 * width, 0.50 * height, 2 * zunit,
                
                0.15 * width, 0.60 * height, 1 * zunit,
                0.30 * width, 0.60 * height, 1 * zunit,
                0.45 * width, 0.60 * height, 1 * zunit,
                
                0.15 * width, 0.10 * height, 0,
                0.35 * width, 0.10 * height, 0,
                0.45 * width, 0.10 * height, 0,
                0.55 * width, 0.10 * height, 0,
                0.65 * width, 0.10 * height, 0,
                0.75 * width, 0.10 * height, 0,
                0.85 * width, 0.10 * height, 0,
                
                0.15 * width, 0.60 * height, -1 * zunit,
                0.35 * width, 0.60 * height, -1 * zunit,
                
                0.55 * width, 0.80 * height, -2 * zunit,
                0.75 * width, 0.80 * height, -2 * zunit,
                0.85 * width, 0.80 * height, -2 * zunit,
                
                0.15 * width, 0.15 * height, -3 * zunit,
                0.35 * width, 0.15 * height, -3 * zunit,
                0.55 * width, 0.15 * height, -3 * zunit,
                0.75 * width, 0.15 * height, -3 * zunit,
                0.85 * width, 0.15 * height, -3 * zunit
             ];
    sugar = 2 * (height / 2) / (tan(PI * 60 / 360));
    szog1 = PI / 6;
    szog2 = PI / 4;
    dmx = 0;
    dmy = 0;
    shift_x = 0;
    shift_y = 0;
    shift_z = 0;
    // arr will contain the values of the weight functions at different levels
    // arr = new Array(7).fill(0);
    drawcn = true;
    drawcp = true;
    drawkp = true;
    notPopup = true;
    entered_pop = false;
    // there is no selected point
    on_point = -1;
    no_tmesh = true;
    point_changed = true;
    
    // az egyes t, s ertekekhez a pontok sulyainak meghatarozasa
    sfContainer = new Array(numpoints * (FELB + 1) * (FELB + 1));
    let felbp1 = FELB + 1;
    let cnt = 0;
    for ( let k = 0; k <= FELB; ++k ) {
        for ( let j = 0; j <= FELB; ++j ) {
            let l = 0;
            for ( let g = 0; g < knot_vecs.length; ++g ) {
                for ( let h = 0; h < knot_vecs[g].length; h += 10 ) {
                    if ( s_vec[j] >= knot_vecs[g][h] && s_vec[j] < knot_vecs[g][h + 4] && t_vec[k] >= knot_vecs[g][h + 5] && t_vec[k] < knot_vecs[g][h + 9] ) {
                        sfContainer[k * felbp1 * numpoints + j * numpoints + l] = nurbs_weight(s_vec[j], knot_vecs[g].slice(h, h + 5)) * nurbs_weight(t_vec[k], knot_vecs[g].slice(h + 5, h + 10));
                    }else {
                        sfContainer[k * felbp1 * numpoints + j * numpoints + l] = 0;
                    }
                    ++l;
                }
            }
        }
    }
    // console.log('cnt', cnt);
    
    surface_display_points = new Array(FELB + 1);
    for ( let i = 0; i <= FELB; ++i ) {
        surface_display_points[i] = new Array((FELB + 1) * 3);
    }
    
    knot_net_s_display_array = new Array(s_points_dy.length);
    for ( let i = 0; i < s_points_dy.length; ++i ) {
        knot_net_s_display_array[i] = new Array(s_points_dy[i].length - 1);
        for ( let j = 0; j < s_points_dy[i].length - 1; ++j ) {
            if ( s_points_dy[i][j] ) {
                knot_net_s_display_array[i][j] = new Array(felbp1 * 3);
            }
        }
    }
    knot_net_t_display_array = new Array(t_points_dy.length);
    for ( let i = 0; i < t_points_dy.length; ++i ) {
        knot_net_t_display_array[i] = new Array(t_points_dy[i].length - 1);
        for ( let j = 0; j < t_points_dy[i].length - 1; ++j ) {
            if ( t_points_dy[i][j] ) {
                knot_net_t_display_array[i][j] = new Array(felbp1 * 3);
            }
        }
    }
    
    knotSContainer = new Array(s_points_dy.length);
    knotSst = new Array(s_points_dy.length);
    felbp1 = knotFelb + 1;
    for ( let k = 0; k < s_points_dy.length; ++k ) {
        knotSContainer[k] = new Array(s_points_dy[k].length - 1);
        knotSst[k] = new Array(s_points_dy[k].length - 1);
        for ( let j = 0; j < s_points_dy[k].length - 1; ++j ) {
            if ( s_points_dy[k][j] ) {
                let tval = abs_t[k + 2];
                knotSst[k][j] = new Array(felbp1 * 2);
                for ( let xx = 1; xx < felbp1 * 2; xx += 2 ) {
                    knotSst[k][j][xx] = tval;
                }
                if ( tval >= t_min && tval <= t_max ) {
                    knotSContainer[k][j] = new Array(felbp1);
                    let skoz = (abs_s[s_tmesh[k + 2][j + 3]] - abs_s[s_tmesh[k + 2][j + 2]]) / knotFelb;
                    for ( let l = 0; l < felbp1; ++l ) {
                        knotSContainer[k][j][l] = new Array(numpoints);
                        let sval = abs_s[s_tmesh[k + 2][j + 2]] + l * skoz;
                        knotSst[k][j][l * 2] = sval;
                        if ( sval >= s_min && sval <= s_max ) {
                            let zz = 0;
                            for ( let g = 0; g < knot_vecs.length; ++g ) {
                                for ( let h = 0; h < knot_vecs[g].length; h += 10 ) {
                                    if ( sval >= knot_vecs[g][h] && sval < knot_vecs[g][h + 4] && tval >= knot_vecs[g][h + 5] && tval < knot_vecs[g][h + 9] ) {
                                        knotSContainer[k][j][l][zz] = nurbs_weight(sval, knot_vecs[g].slice(h, h + 5)) * nurbs_weight(tval, knot_vecs[g].slice(h + 5, h + 10));
                                    }else {
                                        knotSContainer[k][j][l][zz] = 0;
                                    }
                                    ++zz;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    knotTContainer = new Array(t_points_dy.length);
    knotTst = new Array(t_points_dy.length);
    for ( let k = 0; k < t_points_dy.length; ++k ) {
        knotTContainer[k] = new Array(t_points_dy[k].length - 1);
        knotTst[k] = new Array(t_points_dy[k].length - 1);
        for ( let j = 0; j < t_points_dy[k].length - 1; ++j ) {
            if ( t_points_dy[k][j] ) {
                let sval = abs_s[k + 2];
                knotTst[k][j] = new Array(felbp1 * 2);
                for ( let xx = 1; xx < felbp1 * 2; xx += 2 ) {
                    knotTst[k][j][xx] = sval;
                }
                if ( sval >= s_min && sval <= s_max ) {
                    knotTContainer[k][j] = new Array(felbp1);
                    let tkoz = (abs_t[t_tmesh[k + 2][j + 3]] - abs_t[t_tmesh[k + 2][j + 2]]) / knotFelb;
                    for ( let l = 0; l < felbp1; ++l ) {
                        knotTContainer[k][j][l] = new Array(numpoints);
                        let tval = abs_t[t_tmesh[k + 2][j + 2]] + l * tkoz;
                        knotTst[k][j][l * 2] = tval;
                        if ( tval >= t_min && tval <= t_max ) {
                            let zz = 0;
                            for ( let g = 0; g < knot_vecs.length; ++g ) {
                                for ( let h = 0; h < knot_vecs[g].length; h += 10 ) {
                                    if ( sval >= knot_vecs[g][h] && sval < knot_vecs[g][h + 4] && tval >= knot_vecs[g][h + 5] && tval < knot_vecs[g][h + 9] ) {
                                        knotTContainer[k][j][l][zz] = nurbs_weight(sval, knot_vecs[g].slice(h, h + 5)) * nurbs_weight(tval, knot_vecs[g].slice(h + 5, h + 10));
                                    }else {
                                        knotTContainer[k][j][l][zz] = 0;
                                    }
                                    ++zz;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    noLoop();
}

function draw() {
    // draw the curve on page loading and when the parameters have changed
    // clear the canvas
    // scale(1,-1,1);
    // cam.upY = -1;
    // console.log(cam.eyeX, cam.eyeY, cam.eyeZ);
    // console.log(cam.centerX, cam.centerY, cam.centerZ);
    // console.log(cam.upX, cam.upY, cam.upZ);
    // cam.setPosition(-width / 1.5, -height * 1.5, cam.eyeZ);
    // cam.setPosition(0, 0, -sugar * cos(szog1) * cos(szog2));
    background(111);
    
    cam.setPosition(-sugar * sin(szog2) * cos(szog1), -sugar * sin(szog1), sugar * cos(szog1) * cos(szog2));
    cam.lookAt(0,0,0);
    cam.move(shift_x, shift_y, shift_z);
    
    translate(-width / 2, -height / 2);
    // console.log(cam.eyeX, cam.eyeY, cam.eyeZ);
    // console.log('w:', width, 'h:', height);
    // console.log(cam.centerX, cam.centerY, cam.centerZ);
    // console.log('up:', cam.upX, cam.upY, cam.upZ);
    
    // draw control net
    if(drawcn){
        // point / line color
        stroke(180, 180, 180);
        // point / line width
        strokeWeight(1);
        noFill();
        // horizontal
        let cnt = 0;
        for ( let i = 0; i < s_points_dy.length; ++i ) {
            for ( let j = 0; j < s_points_dy[i].length - 1; ++j ) {
                if ( s_points_dy[i][j] ) {
                    line(points[cnt], points[cnt + 1], points[cnt + 2], points[cnt + 3], points[cnt + 4], points[cnt + 5]);
                }
                cnt += 3;
            }
            cnt += 3;
        }
        // vertical
        for ( let i = 0; i < t_points_dy.length; ++i ) {
            for ( let j = 0; j < t_points_dy[i].length - 1; ++j ) {
                if ( t_points_dy[i][j] ) {
                    let tmp1 = tcrawl[i][j] * 3, tmp2 = tcrawl[i][j + 1] * 3;
                    line(points[tmp1], points[tmp1 + 1], points[tmp1 + 2], points[tmp2], points[tmp2 + 1], points[tmp2 + 2]);
                }
            }
        }
    }
    stroke(0);
    // calculate the vertices of the curve
    fill(0, 255, 0);
    if ( drawdm ) {
        strokeWeight(1);
    }else {
        noStroke();
    }
    ambientLight(130, 130, 130);
    pointLight(255, 200, 255, cam.eyeX, cam.eyeY + 100, 1000);
    // pointLight(249, 249, 129, 0, 0, 3 * zunit);
    
    // let vv = createVector(-cam.eyeX, -cam.eyeY, -cam.eyeZ).normalize();
    // directionalLight(255, 255, 255, vv);
    
    // lights();
    // directionalLight(250, 250, 250, ((cam.eyeX - width / 2) / width - 0.5) * 2, ((cam.eyeY - height / 2) / height - 0.5) * 2, -1);
    // directionalLight(0, 255, 0, sin(szog2) * cos(szog1), sin(szog1), -cos(szog1) * cos(szog2));
    // pointLight(255, 255, 255, cam.eyeX, cam.eyeZ, -cam.eyeY);
    ambientMaterial(50, 220, 50);
    let deb1 = 0;
    // for ( let kk = 0; kk < U.length; ++kk ) {
    //     console.log(U[kk]);
    // }
    
    // draw the surface
    if ( point_changed ) {
        calc_surface_points();
        knot_net_display_points();
        point_changed = false;
    }
    let felbp1 = FELB + 1;
    for ( let k = 1; k <= FELB; ++k ) {
        beginShape(TRIANGLE_STRIP);
        for ( let j = 0; j <= FELB; ++j ) {
            vertex(surface_display_points[k - 1][j * 3], surface_display_points[k - 1][j * 3 + 1], surface_display_points[k - 1][j * 3 + 2]);
            // create only valid vertex
            if ( surface_display_points[k][j * 3] != 9999999 ) {
                vertex(surface_display_points[k][j * 3], surface_display_points[k][j * 3 + 1], surface_display_points[k][j * 3 + 2]);
            }
        }
        endShape();
    }

    // console.log(vc);
        
    
    // console.log(deb1);
    // console.log(w_arr);
    
    if(drawkp){
        // draw knotpoints
        stroke(0);
        strokeWeight(3);
        noFill();
        felbp1 = knotFelb + 1;
        // horizontal
        for ( let i = 0; i < s_points_dy.length; ++i ) {
            for ( let j = 0; j < s_points_dy[i].length - 1; ++j ) {
                if ( s_points_dy[i][j] ) {
                    beginShape();
                    for ( let k = 0; k < felbp1; ++k ) {
                        if ( knotSst[i][j][k * 2] >= s_min && knotSst[i][j][k * 2] <= s_max && knotSst[i][j][k * 2 + 1] >= t_min && knotSst[i][j][k * 2 + 1] <= t_max ) {
                            // create only valid vertex
                            if ( knot_net_s_display_array[i][j][k * 3] != 9999999 ) {
                                vertex(knot_net_s_display_array[i][j][k * 3], knot_net_s_display_array[i][j][k * 3 + 1], knot_net_s_display_array[i][j][k * 3 + 2]);
                            }
                        }
                    }
                    endShape();
                }
            }
        }
        // vertical
        for ( let i = 0; i < t_points_dy.length; ++i ) {
            for ( let j = 0; j < t_points_dy[i].length - 1; ++j ) {
                if ( t_points_dy[i][j] ) {
                    beginShape();
                    for ( let k = 0; k < felbp1; ++k ) {
                        if ( knotTst[i][j][k * 2] >= t_min && knotTst[i][j][k * 2] <= t_max && knotTst[i][j][k * 2 + 1] >= s_min && knotTst[i][j][k * 2 + 1] <= s_max ) {
                            // create only valid vertex
                            if ( knot_net_t_display_array[i][j][k * 3] != 9999999 ) {
                                vertex(knot_net_t_display_array[i][j][k * 3], knot_net_t_display_array[i][j][k * 3 + 1], knot_net_t_display_array[i][j][k * 3 + 2]);
                            }
                        }
                    }
                    endShape();
                }
            }
        }
    }
    
    if(drawcp){
        // draw controllpoints
        // console.log('w', width, 'h', height);
        stroke(50, 255, 50);
        scp_arr = [];
        for (var i = 0; i < points.length; i += 3) {
            if ( pointsize_arr[i / 3] != 0 ) {
                strokeWeight(20 * pointsize_arr[i / 3]);
                point(points[i], points[i+1], points[i+2]);
                let fg = screenPosition(points[i], points[i + 1], points[i + 2]);
                scp_arr.push(fg.x + width / 2, fg.y + height / 2);
                // console.log('fg', fg.x + width / 2, fg.y + height / 2);
            }
        }
    }
}

function calc_surface_points() {
    let felbp1 = FELB + 1;
    for ( let k = 0; k <= FELB; ++k ) {
        for ( let j = 0; j <= FELB; ++j ) {
            let sum_x = 0, sum_y = 0, sum_z = 0, nw_sum = 0;
            for ( let l = 0; l < numpoints; ++l ) {
                let nw = sfContainer[k * felbp1 * numpoints + j * numpoints + l] * w_arr[l];
                nw_sum += nw;
                sum_x += nw * points[l * 3];
                sum_y += nw * points[l * 3 + 1];
                sum_z += nw * points[l * 3 + 2];
            }
            // create only valid vertex
            if ( nw_sum > 0 ) {
                let nurbs_div = 1 / nw_sum;
                surface_display_points[k][j * 3] = sum_x * nurbs_div;
                surface_display_points[k][j * 3 + 1] = sum_y * nurbs_div;
                surface_display_points[k][j * 3 + 2] = sum_z * nurbs_div;
            }else {
                surface_display_points[k][j * 3] = 9999999;
                surface_display_points[k][j * 3 + 1] = 0;
                surface_display_points[k][j * 3 + 2] = 0;
            }
        }
    }
}

function knot_net_display_points() {
    felbp1 = knotFelb + 1;
    // horizontal
    for ( let i = 0; i < s_points_dy.length; ++i ) {
        for ( let j = 0; j < s_points_dy[i].length - 1; ++j ) {
            if ( s_points_dy[i][j] ) {
                for ( let k = 0; k < felbp1; ++k ) {
                    if ( knotSst[i][j][k * 2] >= s_min && knotSst[i][j][k * 2] <= s_max && knotSst[i][j][k * 2 + 1] >= t_min && knotSst[i][j][k * 2 + 1] <= t_max ) {
                        let sum_x = 0, sum_y = 0, sum_z = 0, nw_sum = 0;
                        for ( let l = 0; l < numpoints; ++l ) {
                            let nw = knotSContainer[i][j][k][l] * w_arr[l];
                            nw_sum += nw;
                            sum_x += nw * points[l * 3];
                            sum_y += nw * points[l * 3 + 1] - 0.05;
                            sum_z += nw * points[l * 3 + 2];
                        }
                        // create only valid vertex
                        if ( nw_sum > 0 ) {
                            let nurbs_div = 1 / nw_sum;
                            knot_net_s_display_array[i][j][k * 3] = sum_x * nurbs_div;
                            knot_net_s_display_array[i][j][k * 3 + 1] = sum_y * nurbs_div;
                            knot_net_s_display_array[i][j][k * 3 + 2] = sum_z * nurbs_div;
                        }else {
                            knot_net_s_display_array[i][j][k * 3] = 9999999;
                            knot_net_s_display_array[i][j][k * 3 + 1] = 0;
                            knot_net_s_display_array[i][j][k * 3 + 2] = 0;
                        }
                    }
                }
            }
        }
    }
    // vertical
    for ( let i = 0; i < t_points_dy.length; ++i ) {
        for ( let j = 0; j < t_points_dy[i].length - 1; ++j ) {
            if ( t_points_dy[i][j] ) {
                for ( let k = 0; k < felbp1; ++k ) {
                    if ( knotTst[i][j][k * 2] >= t_min && knotTst[i][j][k * 2] <= t_max && knotTst[i][j][k * 2 + 1] >= s_min && knotTst[i][j][k * 2 + 1] <= s_max ) {
                        let sum_x = 0, sum_y = 0, sum_z = 0, nw_sum = 0;
                        for ( let l = 0; l < numpoints; ++l ) {
                            let nw = knotTContainer[i][j][k][l] * w_arr[l];
                            nw_sum += nw;
                            sum_x += nw * points[l * 3];
                            sum_y += nw * points[l * 3 + 1] - 0.05;
                            sum_z += nw * points[l * 3 + 2];
                        }
                        // create only valid vertex
                        if ( nw_sum > 0 ) {
                            let nurbs_div = 1 / nw_sum;
                            knot_net_t_display_array[i][j][k * 3] = sum_x * nurbs_div;
                            knot_net_t_display_array[i][j][k * 3 + 1] = sum_y * nurbs_div;
                            knot_net_t_display_array[i][j][k * 3 + 2] = sum_z * nurbs_div;
                        }else {
                            knot_net_t_display_array[i][j][k * 3] = 9999999;
                            knot_net_t_display_array[i][j][k * 3 + 1] = 0;
                            knot_net_t_display_array[i][j][k * 3 + 2] = 0;
                        }
                    }
                }
            }
        }
    }
}

function distance(px, py, mx, my) {
    let dx = px - mx,
        dy = py - my;
    return dx * dx + dy * dy;
}

function mouseMoved() {
    if ( no_tmesh && mouseX <= mousexmax && mouseY > mouseymin ) {
        let zz = 0;
        for ( var i = 0; i < points.length; i += 3, ++zz ) {
            // let fg = screenPosition(points[i], points[i + 1], points[i + 2]);
            // console.log('fg', fg.x, fg.y);
            if ( distance(scp_arr[zz * 2], scp_arr[zz * 2 + 1], mouseX, mouseY) <= 100 ) {
                if ( on_point != i / 3 && notPopup ) {
                    on_point = i / 3;
                    let mp = document.getElementById("myPopup");
                    mp.style.left = (mouseX - mp.offsetWidth / 2) + 'px';
                    mp.style.top = mouseY + 'px';
                    mp.classList.add("show");
                    notPopup = false;
                }
                break;
            }
        }
    }
}

function mousePressed() {
    if ( mouseX <= mousexmax && mouseY > mouseymin ) {
        let popup = document.getElementById("myPopup");
        if ( popup.classList.contains("show") ) {
            popup.classList.remove("show");
            on_point = -1;
            notPopup = true;
        }
        if ( mouseButton === CENTER ) {
            shift_x = 0;
            shift_y = 0;
            shift_z = 0;
            redraw();
        }else {
            dmx = mouseX;
            dmy = mouseY;
        }
    }
}

function mouseDragged() {
    if ( mouseX <= mousexmax && mouseY > mouseymin ) {
        if ( mouseButton === LEFT ) {
            let deltax = mouseX - dmx, deltay = mouseY - dmy;
            // if dragged to right direction (+x)
            if ( deltax > 0 ) {
                szog2 += (deltax / width) * PI;
                redraw();
            }else if ( deltax < 0 ) {
                szog2 += (deltax / width) * PI;
                redraw();
            }
            
            // if dragged to down direction (+y)
            if ( deltay > 0 ) {
                szog1 += (deltay / height) * PI;
                if ( szog1 > PI / 2 ) {
                    szog1 = PI / 2;
                }
                redraw();
            }else if ( deltay < 0 ) {
                szog1 += (deltay / height) * PI;
                if ( szog1 < -PI / 2 ) {
                    szog1 = -PI / 2;
                }
                redraw();
            }
        } else if ( mouseButton === RIGHT ) {
            let deltax = mouseX - dmx, deltay = mouseY - dmy;
            // if dragged to right direction (+x)
            if ( deltax > 0 ) {
                shift_x += deltax;
                redraw();
            }else if ( deltax < 0 ) {
                shift_x += deltax;
                redraw();
            }
            
            // if dragged to down direction (+y)
            if ( deltay > 0 ) {
                shift_y += deltay;
                redraw();
            }else if ( deltay < 0 ) {
                shift_y += deltay;
                redraw();
            }
        }
        dmx = mouseX;
        dmy = mouseY;
    }
}

function mouseWheel(event) {
    if ( mouseX <= mousexmax && mouseY > mouseymin ) {
        if ( !entered_pop ) {
            // if wheel down then zoom out
            if ( event.delta > 0 ) {
                sugar *= 1.1;
                redraw();
            }else {
                sugar *= 0.9;
                redraw();
            }
        }
    }
}

function keyPressed() {
    // down arrow
    if ( keyCode === 40 ) {
        shift_y += 10;
        redraw();
    }
    // up arrow
    if ( keyCode === 38 ) {
        shift_y -= 10;
        redraw();
    }
    // right arrow
    if ( keyCode === 39 ) {
        shift_x += 10;
        redraw();
    }
    // left arrow
    if ( keyCode === 37 ) {
        shift_x -= 10;
        redraw();
    }
    // zoom in with key j
    if ( keyCode === 74 ) {
        shift_z += 10;
        redraw();
    }
    // zoom out with key f
    if ( keyCode === 70 ) {
        shift_z -= 10;
        redraw();
    }
    // back to original camera position
    if ( keyCode === 13 ) {
        shift_x = 0;
        shift_y = 0;
        shift_z = 0;
        redraw();
    }
}