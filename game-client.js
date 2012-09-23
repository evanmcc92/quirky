/*
  This file is part of Quirky.

  Quirky is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Quirky is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Quirky.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview Quirky client library
 * @author juan.lasheras@gmail.com (Juan Lasheras)
 */

"use strict";

var pastels = {
    "green": "#A0E7A0",
    "yellow": "#FFFB8C",
    "red": "#CD2626",
    "orange": "#FFAF5A",
    "purple": "#FF8CB6",
    "blue": "#97D0F9"
};

var ushapes = {
    "circle": "&#9679;",
    "star": "&#10022;",
    "diamond": "&#9670;",
    "square": "&#9632;",
    "triangle": "&#9650;",
    "clover": "&#9827;"
};

// My Turn state
var HAVETURN = null;

// right pointing finger
var finger = "&#9755;";

// Define DOM element IDs
var ADDGAME = '#add_game';
var ADDGUEST = '#add_guest';
var ADDGUESTFRM = '#add_guest_form';
var ADDPIECE = '#add_piece';
var ADDPLAYER = '#add_player';
var BOARD = '#board';
var CHATIN = '#chat_input';
var CHATLOG = '#chat_log';
var CHATPNL = '#chat_panel';
var ERRORS = '#errors';
var GAMEPIECES = '#game_pieces';
var GAMEROOM = '#game_room';
var GAMES = '#games_tbl';
var GAMESHR = '#lobby_game_panel>hr';
var LEAVEGAME = '#leave_game';
var LOBBY = '#lobby';
var LOBBYCHAT = '#lobby_chat';
var NOGAMESMSG = '#no_games';
var PIECES = '#pieces';
var PLAYERS = '#players';
var PLAYERTBL = '#player_table';
var TURN = '#turn';

// Define DOM class names
var GRIDCLS = '.grid';
var PIECECLS = '.piece';
var SNAPGRIDCLS = '.snapgrid';

// Define timeoutIDs for Ajax calls
var DRAWCHATTID = null;
var GETGAMESTID = null;
var GETPLAYERSTID = null;

/**
 * Process player data.
 */
function getPlayers() {
    $.getJSON("/games/"+$.cookie("game")+"/players", onGetPlayers);
}

/*
 * Operates on player data returned from the server.
 * @param {obj} pdata json data from the server
 */
function onGetPlayers(pdata) {
    // if no players to display, hide the player table
    $.isEmptyObject(pdata) ? $(PLAYERTBL).hide() : $(PLAYERTBL).show();

    $(PLAYERS).empty();
    // display all players
    for (var p in pdata) {
        if (!pdata.hasOwnProperty(p))
            continue;
        var turn = pdata[p]['has_turn'] ? finger : "";
        $(PLAYERS).append(
            "<tr>"+
            "<td class='pturn'>"+turn+"</td>"+
            "<td class='pdata'>"+p+"</td>"+
            "<td class='pdata'>"+pdata[p]['points']+"</td>"+
            "</tr>");
    }

    var my_game = $.cookie("game");
    var my_player = $.cookie("player");
    if (my_player) {
        if (pdata[my_player] === undefined) {
            // I've got a player name, but we need to add it to the game
            $.post("/games/"+my_game+"/players", {name: my_player},
                   function() {getPlayers();});
        } else if (HAVETURN !== pdata[my_player].has_turn) {
            HAVETURN = pdata[my_player].has_turn;
            drawTurnInfo(pdata);
        }
    }
}

/**
 * Draw player's pieces and It's Your Turn info.
 * @param {obj} pdata json data from the server
 */
function drawTurnInfo(pdata) {
    var my_game = $.cookie("game");
    var my_player = pdata[$.cookie("player")];

    $(PIECES).empty();
    $(TURN).empty();
    $(ADDPIECE).show();

    // allow player to end his turn
    if (my_player["has_turn"]) {
        $(TURN).append("It's your turn! <button>End my turn</button>");
        $(TURN+"> button")[0].onclick = function() {
            $.post("/games/"+my_game+"/players", {end_turn: true}, function() {
                getPlayers();
            });
        };
    }
    getMyPieces(my_player);
    getPiecesLeft();
    getBoard();
}

/**
 * Add player's pieces to his sideboard and make active if it's his turn.
 * @param {obj} player
 */
function getMyPieces(player) {
    for (var i in player["pieces"]) {
        var piece = player["pieces"][i];
        $(PIECES).append('<div class="piece" style="color:'+
                         pastels[piece.color]+'">'+ushapes[piece.shape]+'</div>');
        $(PIECECLS+":last-child").data("piece", piece);
        $(PIECES).append("<div style='float: left; margin: 2px'>&nbsp</div>");
    }

    $(PIECECLS).width($(GRIDCLS).width());
    $(PIECECLS).height($(GRIDCLS).height());
    $(PIECECLS).css("font-size", $(GRIDCLS).css("font-size"));

    if (player['has_turn'])
        $(PIECECLS).draggable({
            containment: "#board",
            snap: ".snapgrid"
        });
}

/**
 * Publish the number of pieces left in the bag.
 */
function getPiecesLeft() {
    $.getJSON("/games/"+$.cookie("game")+"/pieces", function(data) {
        $(GAMEPIECES).empty();
        var npieces = 0;
        for (var i in data)
            npieces += data[i].count;
        $(GAMEPIECES).html(npieces);
    });
}

/**
 * When piece is dropped, send a POST to the server to add to board. Either the
 * piece will be added or we get an error back for invalid placements.
 */
function onPieceDrop(event, ui) {
    var col = $(this).data()['col'];
    var row = $(this).data()['row'];
    var piece = $(ui.draggable).data()['piece'];
    $.ajax({
        type: 'POST',
        url: "/games/"+$.cookie("game")+"/board",
        data: {
            shape: piece['shape'],
            color: piece['color'],
            row: row,
            column: col
        },
        success: function() {
            $(ERRORS).empty();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $(ERRORS).empty();
            $(ERRORS).append("<div class='error'>&#9888; "+jqXHR.responseText+"</div>");
        },
        complete: function() {
            $.getJSON("/games/"+$.cookie("game")+"/players", drawTurnInfo);
        }
    });
}

/**
 * Draw the game board.
 */
function getBoard() {
    var game = $.cookie("game");
    var board_margin = 5;
    var rows = 0, cols = 0;
    var dimensions = {};

    $.getJSON("/games/"+game+"/dimensions", function (data) {
        var dimensions = data;
        // add 5 for each side since players can add up to 5 pieces per turn
        var top = dimensions["top"] - board_margin;
        var bottom = dimensions["bottom"] + board_margin;
        var left = dimensions["left"] - board_margin;
        var right = dimensions["right"] + board_margin;

        $(BOARD).empty();

        var rows = bottom - top + 1;
        var cols = right - left + 1;
        var k = 1;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                $(BOARD).append('<div class="grid"></div>');
                $(GRIDCLS+":last-child").data(
                    "col", (j+left)).data("row", (top+i));
            }
        }

        $(GRIDCLS).css("width", (100/cols)+"%");
        $(GRIDCLS).css("height", (100/rows)+"%");
        $(GRIDCLS).css("font-size", $(GRIDCLS).height());

        //$(BOARD).css("width", (($(GRIDCLS).width()) * 10))
        //$(BOARD).css("height", (($(GRIDCLS).height()) * 10))

        $.getJSON("/games/"+game+"/board", function (data) {
            // place pieces on board
            if (data.length > 0) {
                for (i in data) {
                    var piece = data[i].piece;
                    var row = data[i].row;
                    var col = data[i].column;
                    var drow = row - dimensions["top"] + board_margin;
                    var dcol = col - dimensions["left"] + board_margin;
                    var idx = drow*cols + dcol + 1;
                    $(GRIDCLS+":nth-child("+idx+")").addClass("boardpiece");
                    $(GRIDCLS+":nth-child("+idx+")").css("color",
                                                      pastels[piece.color]);
                    $(GRIDCLS+":nth-child("+idx+")").html(ushapes[piece.shape]);
                }
            } else {  // place marker in center if board is empty
                var idx = parseInt(($(GRIDCLS).length + 1) / 2);
                $(GRIDCLS+":nth-child("+idx+")").addClass('snapgrid');
            }

            // iterate through board and mark spots adjacent to pieces
            if (data.length > 0) {
                var offsets = [1, -1, cols, -cols];
                for (var i = 1; i <= $(GRIDCLS).length; i++) {
                    var cur = $(GRIDCLS+":nth-child("+i+")")
                    for (var j in offsets) {
                        var next = $(GRIDCLS+":nth-child("+(i+offsets[j])+")");
                        if (!cur.hasClass("boardpiece") &&
                            next.hasClass("boardpiece"))
                            cur.addClass("snapgrid");
                    }
                }
            }

            $(SNAPGRIDCLS).droppable({
                accept: PIECECLS,
                activate: function (event, ui) { $(SNAPGRIDCLS).html("&middot;"); },
                deactivate: function (event, ui) { $(SNAPGRIDCLS).html(""); },
                drop: onPieceDrop,
            });
        })
    })
}

/**
 * Draw the chat input.
 */
function drawChatIn() {
    $(CHATIN).show();
    function submit() {
        var my_player = $.cookie("player");
        var game = $.cookie("game");
        if (game)
            var resource = "/games/"+game+"/chat";
        else
            var resource = "/chat";
        $.post(resource, {
            input: $(CHATIN+"> input")[0].value,
            name: my_player
        }, function() {
            $(CHATIN+"> input").val('');  // post was succesful, so clear input
            drawChatLog();
        });
    }
    $(CHATIN+"> button").click(submit);
    $(CHATIN+"> input:visible").focus();
    $(CHATIN+"> input").keydown(function(event) {
        if (event.keyCode === 13) {
            submit();
        }
    });
}

/**
 * Draw the add guest widget.
 * - Set the player cookie when the user submits and switch to displaying the
 * chat input.
 */
function drawAddGuest() {
    $(ADDGUEST).show();
    function submit() {
        var name =  $(ADDGUESTFRM+"> input")[0].value;
        $.cookie("player", name);
        main();
    };
    $(ADDGUESTFRM+"> button").click(submit);
    $(ADDGUESTFRM+"> input:visible").focus();
    $(ADDGUESTFRM+"> input").keydown(function(event) {
        if (event.keyCode === 13) {
            submit();
        }
    });
}

/**
 * Draw the chat log.
 * Implemented as a closure to keep state about what the last line on the chat
 * received from the server was.
 */
var drawChatLog = function() {
    var lastids = {};
    return function () {
        var my_player = $.cookie("player");
        var my_game = $.cookie("game");
        var uri = my_game ? '/games/' + my_game + '/chat' : '/chat';
        $.getJSON(uri, {lastid: lastids[uri]}, function(data) {
            if ($.isEmptyObject(data)) {
                // Server returns empty obj if there's nothing new
                return;
            }
            for (var i=0; i<data.length; i++) {
                var name = data[i]['name'];
                var msgcls = (name == my_player) ? "mymsg": "othermsg";
                $(CHATLOG).append('<div><span class="'+msgcls+'">'+
                                  data[i]['name']+'</span>: '+
                                  data[i]['input']+'</div>');
            }
            lastids[uri] = data[i-1] ? data[i-1]['id']: undefined;
        });
    };
}();

/**
 * Draw the game list.
 */
function drawGameList(games) {
    $(GAMES).empty()
    var thead = "<th>Game Room</th><th>Players</th><th></th>";
    for (var i in games) {
        if (!games.hasOwnProperty(i))
            continue;
        var name = games[i]['name'];
        var node = $("<td class='game_link'>"+name+"</td>")[0];
        node.onclick = function () {
            $.cookie('game', name);
            clearTimeout(GETGAMESTID);
            location.reload();
        };
        $(GAMES).append("<tr>"+
                        "<td>"+Object.keys(games[i]['players']).length+"</td>"+
                        "<td></td>"+
                        "</tr>");
        $(GAMES+">tbody>tr:last-child").prepend(node);
    }

    if (!$(GAMES+">*").length) {
        $(NOGAMESMSG).show();
        $(GAMESHR).hide();
    } else {
        $(GAMESHR).show();
        $(GAMES).prepend(thead);
    }

    function submit() {
        var name = $(ADDGAME+"> input")[0].value;
        $.post('/games', {name: name}, function() {
            $(ADDGAME+"> input").val('');  // post was succesful, so clear input
            if (!$(GAMES+">*").length) {  // add thead if this is the first one
                $(NOGAMESMSG).hide();
                $(GAMES).prepend(thead);
                $(GAMESHR).show();
            }
            $(GAMES).append("<tr><td>"+name+"</td><td>0</td><td></td></tr>");
        });
    }

    // TODO: figure out why jquery click and keydown functions screw this up?
    $(ADDGAME+"> button")[0].onclick = submit;
    $(ADDGAME+"> input")[0].onkeydown = function(event) {
        if (event.keyCode === 13) {
            submit();
        }
    };
}

/**
 * Draw the logo
 */
function drawLogo() {
    // var i=0;
    // var logo = ["Q", "u", "i", "r", "k", "y"].map(function(x) {
    //     var color = Object.keys(pastels)[i];
    //     i += 1;
    //     return ("<span style='color: " +
    //             pastels[color] + ";'>" + x + "</span>");
    // });
    // $('.logo').html(logo.join(''));
    $('.logo').html("Quirky");
}

/**
 * Draw the lobby.
 */
function drawLobby(games) {
    $(LOBBYCHAT).append($(CHATPNL)[0]);
    $(CHATPNL).addClass('lobby_chat_panel');
    drawGameList(games);
    drawLogo();

    // setup future calls to get game list
    function pollGames() {
        $.getJSON("/games", drawGameList);
        GETGAMESTID = setTimeout(pollGames, 2000);
    }
    GETGAMESTID = setTimeout(pollGames, 2000);
}

/**
 * Draw the game.
 */
function drawGame() {
    getPlayers();
    getBoard();
    getPiecesLeft();
    $(GAMEROOM).append($(CHATPNL)[0]);
    $(CHATPNL).addClass('game_chat_panel');
    $(LEAVEGAME)[0].onclick = function () {
        $.removeCookie('game');
        location.reload();
        clearTimeout(GETPLAYERSTID);
    };

    // setup future calls
    function pollPlayers() {
        getPlayers();
        GETPLAYERSTID = setTimeout(pollPlayers, 2000);
    }
    GETPLAYERSTID = setTimeout(pollPlayers, 2000);
}

/**
 * Display the lobby, a game room, or the add guest for the user.
 */
function gameOrLobby(games) {
    $(LOBBY).hide();
    $(GAMEROOM).hide();
    $(ADDGUEST).hide();

    if (!$.cookie("player")) {
        drawAddGuest();
        return;
    }

    var my_game = $.cookie("game");
    // User is not in a valid game
    if (typeof games[my_game] === 'undefined') {
        $.removeCookie('game');
        $(LOBBY).show()
        drawLobby(games);
    } else {
        $(GAMEROOM).show();
        drawGame();
    }
    $(CHATPNL).show();
    drawChatLog();
    drawChatIn();

    // setup future calls to get chat
    function pollChat() {
        drawChatLog();
        DRAWCHATTID = setTimeout(pollChat, 2000);
    }
    DRAWCHATTID = setTimeout(pollChat, 2000);
}

/**
 * Main function.
 * - If the user has a game cookie, look up and put him in the game.
 * - Otherwise, put him in the lobby.
 */
function main() {
    $.getJSON("/games", gameOrLobby);
}

$(function() {
    main();
});
