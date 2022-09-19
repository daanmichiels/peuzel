function randomNumber(lo, hi) {
    return lo + Math.random() * (hi - lo);
}

function createInterlockingEdge(length, orientation) {
    let neckWidth = Math.round(randomNumber(0.2, 0.3) * length);
    let headWidth = Math.round(randomNumber(0.1, 0.2) * length + neckWidth);
    let headHeight = Math.round(randomNumber(0.2, 0.3) * length);

    let neckLeft = 0.5 * length - 0.5 * neckWidth;
    let neckRight = 0.5 * length + 0.5 * neckWidth;
    let earLeft = 0.5 * length - 0.5 * headWidth;
    let earRight = 0.5 * length + 0.5 * headWidth;

    let path = [
        [0, 0],
        [neckLeft, 0],
        [earLeft, 0.5 * headHeight],
        [0.5 * length, headHeight],
        [earRight, 0.5 * headHeight],
        [neckRight, 0],
        [length, 0],
    ];

    if (orientation === 'up' || orientation === 'left') {
        let newPath = [];
        for (let i=0; i<path.length; ++i) {
            newPath.push([path[i][0], -path[i][1]]);
        }
        path = newPath;
    }

    if (orientation === 'right' || orientation === 'left') {
        let newPath = [];
        for (let i=0; i<path.length; ++i) {
            newPath.push([path[i][1], path[i][0]]);
        }
        path = newPath;
    }
    return path;
}

function randomColor() {
    let r = Math.floor(randomNumber(0, 255));
    let g = Math.floor(randomNumber(0, 255));
    let b = Math.floor(randomNumber(0, 255));
    return `rgb(${r}, ${g}, ${b})`;
}

function translatePath(path, dx, dy) {
    let result = [];
    for (let i=0; i<path.length; ++i) {
        result.push([dx + path[i][0], dy + path[i][1]]);
    }
    return result;
}

function reversePath(path) {
    let result = [];
    for (let i=0; i<path.length; ++i) {
        result.push(path[path.length - 1 - i]);
    }
    return result;
}

function pathToSvg(path, x, y) {
    let result = `M ${x + path[0][0]} ${y + path[0][1]} `;
    for (let i=1; i<path.length; ++i) {
        result += `L ${x + path[i][0]} ${y + path[i][1]} `;
    }
    return result;
}

function go() {
    let svg = document.getElementById('game-svg');

    let selectedImage = availableImages[Math.floor(availableImages.length * Math.random())];
    document.getElementById('the-image').setAttribute('x', `${-selectedImage.width * 0.5}`);
    document.getElementById('the-image').setAttribute('y', `${-selectedImage.height * 0.5}`);
    document.getElementById('the-image').setAttribute('width', `${selectedImage.width}`);
    document.getElementById('the-image').setAttribute('height', `${selectedImage.height}`);
    document.getElementById('the-image').setAttribute('href', selectedImage.href);

    console.log(selectedImage);

    let snapRadius = 40;
    let nRows = 8;
    let nCols = 10;
    let componentsRemaining = nRows * nCols;
    let componentsSnappedToTable = 0;
    let pieceWidth = selectedImage.width / nCols;
    let pieceHeight = selectedImage.height / nRows;
    let puzzleRect = {
        left: -selectedImage.width * 0.5,
        top: -selectedImage.height * 0.5,
        width: selectedImage.width,
        height: selectedImage.height,
    };
    let playingAreaRect = {
        left: -selectedImage.width * 0.5 * 1.2,
        top: -selectedImage.height * 0.5 * 1.1,
        width: selectedImage.width * 1.2,
        height: selectedImage.height * 2.0 * 1.1,
    };
    let viewBox;

    let hEdges = [];
    for (let i=0; i<nRows+1; ++i) {
        let row = [];
        for (let j=0; j<nCols; ++j) {
            let path;
            if (i > 0 && i < nRows) {
                let hOrientation = Math.random() < 0.5 ? 'up' : 'down';
                path = createInterlockingEdge(pieceWidth, hOrientation);
            } else {
                path = [[0, 0], [pieceWidth, 0]];
            }
            row.push(path);
        }
        hEdges.push(row);
    }

    let vEdges = [];
    for (let i=0; i<nRows; ++i) {
        let col = [];
        for (let j=0; j<nCols+1; ++j) {
            let path;
            if (j > 0 && j < nCols) {
                let vOrientation = Math.random() < 0.5 ? 'left' : 'right';
                path = createInterlockingEdge(pieceHeight, vOrientation);
            } else {
                path = [[0, 0], [0, pieceHeight]];
            }
            col.push(path);
        }
        vEdges.push(col);
    }

    let svgDefs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    svg.appendChild(svgDefs);

    let targetRect = document.createElementNS('http://www.w3.org/2000/svg','path');
    targetRect.setAttribute('style', 'stroke: #000; stroke-width: 2px; stroke-linecap: round; fill: #ccc;');
    targetRect.setAttribute('d', `M ${puzzleRect.left} ${puzzleRect.top} h ${puzzleRect.width} v ${puzzleRect.height} h ${-puzzleRect.width} Z`);
    svg.appendChild(targetRect);

    let components = [];
    for (let i=0; i<nRows; ++i) {
        for (let j=0; j<nCols; ++j) {
            let path = [];
            path = path.concat(hEdges[i][j]);
            path = path.concat(translatePath(vEdges[i][j+1], pieceWidth, 0));
            path = path.concat(reversePath(translatePath(hEdges[i+1][j], 0, pieceHeight)));
            path = path.concat(reversePath(vEdges[i][j]));

            let elemClip = document.createElementNS('http://www.w3.org/2000/svg','clipPath');
            elemClip.id = `clip_${i}_${j}`;
            let elemClipPath = document.createElementNS('http://www.w3.org/2000/svg','path');
            elemClipPath.setAttribute('d', pathToSvg(path, puzzleRect.left + pieceWidth * j, puzzleRect.top + pieceHeight * i) + 'Z');
            elemClip.appendChild(elemClipPath);
            svgDefs.appendChild(elemClip);

            let group = document.createElementNS('http://www.w3.org/2000/svg','g');
            group.id = `component_${components.length}`;
            let pieceGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
            pieceGroup.id = `piece_${i}_${j}`;
            let piece = document.createElementNS('http://www.w3.org/2000/svg','use');
            piece.setAttribute('href', '#the-image');
            piece.setAttribute('clip-path', `url(#${elemClip.id})`);
            let elemPath = document.createElementNS('http://www.w3.org/2000/svg','path');
            elemPath.setAttribute('d', pathToSvg(path, puzzleRect.left + pieceWidth * j, puzzleRect.top + pieceHeight * i) + 'Z');
            elemPath.setAttribute('stroke', 'black');
            elemPath.setAttribute('fill', '#ffffff00');
            elemPath.setAttribute('stroke-width', '1');
            pieceGroup.appendChild(piece);
            pieceGroup.appendChild(elemPath);
            if (false) {
                let elemDebug = document.createElementNS('http://www.w3.org/2000/svg','circle');
                elemDebug.setAttribute('cx', '0');
                elemDebug.setAttribute('cy', '0');
                elemDebug.setAttribute('r', '5');
                elemDebug.setAttribute('fill', 'red');
                pieceGroup.appendChild(elemDebug);
            }
            // let transformX = randomNumber(0, 20);
            let transformX = randomNumber(puzzleRect.left, puzzleRect.left + puzzleRect.width) - puzzleRect.left - pieceWidth * j;
            let transformY = randomNumber(puzzleRect.top + puzzleRect.height, puzzleRect.top + 2 * puzzleRect.height) - puzzleRect.top - pieceHeight * i;
            group.setAttribute('transform', `translate(${transformX}, ${transformY})`);
            group.setAttribute('class', 'draggable');
            group.appendChild(pieceGroup);
            svg.appendChild(group);

            components.push({
                group: group,
                row_lo: i,
                row_hi: i + 1,
                col_lo: j,
                col_hi: j + 1,
                transform: {
                    x: transformX,
                    y: transformY,
                },
                snappedToTable: false,
                n_pieces: 1,
                neighbors: new Set([i * nCols + j]),
                elem_path: elemPath,
            });
        }
    }

    for (let i=0; i<nRows; ++i) {
        for (let j=0; j<nCols; ++j) {
            if (i > 0)
                components[i * nCols + j].neighbors.add((i - 1) * nCols + j);
            if (i + 1 < nRows)
                components[i * nCols + j].neighbors.add((i + 1) * nCols + j);
            if (j > 0)
                components[i * nCols + j].neighbors.add(i * nCols + (j - 1));
            if (j + 1 < nCols)
                components[i * nCols + j].neighbors.add(i * nCols + (j + 1));
        }
    }

    let isDragging = false;
    let draggedComponent;
    let transformAtDragStart;
    let mousePosAtDragStart;

    function getMousePositionInSvgUnits(e) {
        let ctm = svg.getScreenCTM();
        return {
            x: (e.clientX - ctm.e) / ctm.a,
            y: (e.clientY - ctm.f) / ctm.d
        };
    }

    function updateComponentPosition(component) {
        component.group.setAttribute('transform', `translate(${component.transform.x}, ${component.transform.y})`);
    }

    function clampToVisibleArea(component) {
        let margin = 4;
        let componentRect = {
            left: component.transform.x + puzzleRect.left + component.col_lo * pieceWidth - margin,
            right: component.transform.x + puzzleRect.left + component.col_hi * pieceWidth + margin,
            top: component.transform.y + puzzleRect.top + component.row_lo * pieceHeight - margin,
            bottom: component.transform.y + puzzleRect.top + component.row_hi * pieceHeight + margin,
        };
        if (componentRect.left < viewBox.left) {
            component.transform.x += (viewBox.left - componentRect.left);
        }
        if (componentRect.right > viewBox.left + viewBox.width) {
            component.transform.x -= (componentRect.right - viewBox.left - viewBox.width);
        }
        if (componentRect.top < viewBox.top) {
            component.transform.y += (viewBox.top - componentRect.top);
        }
        if (componentRect.bottom > viewBox.top + viewBox.height) {
            component.transform.y -= (componentRect.bottom - viewBox.top - viewBox.height);
        }
    }

    function startDrag(evt) {
        evt.preventDefault();
        let e;
        if (evt.touches)
            e = evt.touches[0];
        else
            e = evt;
        let elem = e.target.parentElement.parentElement;
        if (elem.classList.contains('draggable')) {
            isDragging = true;
            mousePosAtDragStart = getMousePositionInSvgUnits(e);
            draggedComponent = parseInt(elem.id.split('_')[1]);
            transformAtDragStart = {
                x: components[draggedComponent].transform.x,
                y: components[draggedComponent].transform.y,
            };
            svg.appendChild(components[draggedComponent].group);
        }
    }

    function drag(evt) {
        let e;
        if (evt.touches)
            e = evt.touches[0];
        else
            e = evt;
        if (isDragging) {
            evt.preventDefault();
            let mousePos = getMousePositionInSvgUnits(e);
            let dx = mousePos.x - mousePosAtDragStart.x;
            let dy = mousePos.y - mousePosAtDragStart.y;
            components[draggedComponent].transform.x = transformAtDragStart.x + dx;
            components[draggedComponent].transform.y = transformAtDragStart.y + dy;
            clampToVisibleArea(components[draggedComponent]);
            updateComponentPosition(components[draggedComponent]);
        }
    }

    function handleSnapping(componentIndex) {
        let x = components[componentIndex].transform.x;
        let y = components[componentIndex].transform.y;

        // check whether to snap to table
        let snapToTable = (x * x + y * y <= snapRadius * snapRadius);
        let componentsAlreadySnappedToTable = 0;

        // find all components we should snap to (including self)
        let idxs = [];
        let neighborIndexArray = Array.from(components[componentIndex].neighbors);
        for (let i=0; i<neighborIndexArray.length; ++i) {
            let idx = neighborIndexArray[i];
            let otherComponent = components[idx];
            if (otherComponent === undefined)
                continue;
            let dx = otherComponent.transform.x - x;
            let dy = otherComponent.transform.y - y;
            if (dx * dx + dy * dy <= snapRadius * snapRadius) {
                idxs.push(idx);
                if (otherComponent.snappedToTable) {
                    snapToTable = true;
                    componentsAlreadySnappedToTable += 1;
                }
            }
        }

        if (idxs.length === 1 && !snapToTable)
            return;

        // compute target position
        let targetPosition;
        if (snapToTable) {
            targetPosition = {x: 0, y: 0};
        } else {
            // weighted average of components
            let totalPosition = {x: 0, y: 0};
            let totalPieces = 0;
            for (let i=0; i<idxs.length; ++i) {
                totalPosition.x += components[idxs[i]].n_pieces * components[idxs[i]].transform.x;
                totalPosition.y += components[idxs[i]].n_pieces * components[idxs[i]].transform.y;
                totalPieces += components[idxs[i]].n_pieces;
            }
            targetPosition = {
                x: totalPosition.x / totalPieces,
                y: totalPosition.y / totalPieces,
            }
        }
        let pathsToHighlight = [...components[componentIndex].group.children];
        // merge components
        for (let i=0; i<idxs.length; ++i) {
            if (idxs[i] === componentIndex)
                continue;
            let neighbor = components[idxs[i]];

            if (!neighbor.snappedToTable) {
                pathsToHighlight.push(...neighbor.group.children);
            }

            // move all svg elements over
            components[componentIndex].group.append(...neighbor.group.children);
            neighbor.group.remove();

            // fix neighborhood pointers
            let nnArray = Array.from(neighbor.neighbors);
            for (let j=0; j<nnArray.length; ++j) {
                let neighborNeighbor = components[nnArray[j]];
                neighborNeighbor.neighbors.delete(idxs[i]);
                neighborNeighbor.neighbors.add(componentIndex);
                components[componentIndex].neighbors.add(nnArray[j]);
            }
            components[componentIndex].neighbors.delete(idxs[i]);

            delete components[idxs[i]];
        }

        components[componentIndex].transform.x = targetPosition.x;
        components[componentIndex].transform.y = targetPosition.y;
        updateComponentPosition(components[componentIndex]);
        if (snapToTable) {
            // disable dragging
            components[componentIndex].snappedToTable = true;
            components[componentIndex].group.setAttribute('class', '');
            componentsSnappedToTable += 1 - componentsAlreadySnappedToTable;

            svg.insertBefore(components[componentIndex].group, targetRect.nextSibling);

        }
        componentsRemaining -= idxs.length - 1;

        for (let i=0; i<pathsToHighlight.length; ++i) {
            let pathElem = pathsToHighlight[i].children[1];
            pathElem.style.transition = 'fill 0s ease';
            pathElem.style.fill = '#ffffff66';
        }

        setTimeout(() => {
            for (let i=0; i<pathsToHighlight.length; ++i) {
                let pathElem = pathsToHighlight[i].children[1];
                pathElem.style.transition = 'fill 1s ease';
                pathElem.style.fill = '#ffffff00';
            }
        }, 100);

        if (componentsSnappedToTable === componentsRemaining) {
            setTimeout(() => {
                showMenu(true);
            }, 20);
        }
    }

    function endDrag(evt) {
        if (!isDragging)
            return;
        evt.preventDefault();
        handleSnapping(draggedComponent);
        isDragging = false;
        draggedComponent = null;
        transformAtDragStart = null;
        mousePosAtDragStart = null;
    }

    function handleResize(e) {
        let W = document.body.clientWidth;
        let H = document.body.clientHeight;
        if (W * playingAreaRect.height > H * playingAreaRect.width) {
            let viewW = W * playingAreaRect.height / H;
            let margin = (viewW - playingAreaRect.width) * 0.5;
            let viewH = playingAreaRect.height;
            viewBox = {
                left: -margin+playingAreaRect.left,
                top: playingAreaRect.top,
                width: viewW,
                height: viewH,
            };
        } else {
            let viewW = playingAreaRect.width;
            let viewH = H * playingAreaRect.width / W;
            let margin = (viewH - playingAreaRect.height) * 0.5;
            viewBox = {
                left: playingAreaRect.left,
                top: -margin+playingAreaRect.top,
                width: viewW,
                height: viewH,
            };
        }
        svg.setAttribute('viewBox', `${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`);

        for (let i=0; i<components.length; ++i) {
            let component = components[i];
            if (component === undefined)
                continue;
            clampToVisibleArea(component);
            updateComponentPosition(component);
        }
    }

    handleResize(null);

    window.addEventListener('resize', handleResize);
    document.body.addEventListener('resize', handleResize);
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);
}

function showMenu(show) {
    if (show) {
        document.getElementById('menu-wrapper').style.display = 'flex';
    } else {
        document.getElementById('menu-wrapper').style.display = 'none';
    }
}