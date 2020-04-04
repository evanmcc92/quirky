Quirky
======
![build](https://travis-ci.org/evanmcc92/quirky.svg?branch=master)

Quirky is a [Qwirkle](http://www.google.com/search?q=qwirkle+board+game) board
game clone built with node.js and jQuery.

Preview : https://e2-qwirkle.herokuapp.com/

Forked from original code from [jlas](https://github.com/jlas/quirky). This fork enables :
* add support for current node.js version
* add touch screen support, enabling play on tablet and mobile
* add possibility to put pieces back to bag
* add better color contrast
* add +6 bonus when 6 piece in line
* fix in point couting
* fix in piece positioning check

## Screenshots

![quirky](https://raw.github.com/evanmcc92/quirky/master/media/scrnshot1.png)

* Game Lobby:

![quirky](https://raw.github.com/evanmcc92/quirky/master/media/scrnshot2.png)

## Install & Run

    $ git clone https://github.com/evanmcc92/quirky

install with npm:

    $ npm install quirky

run the game server:

    $ npm start quirky

... then go to http://localhost:8010 and play! Optionally, you can change the default http port:

    $ npm config set quirky:port <port>

## Third party things included (not made by me):

### Libraries

These libraries are no longer hosted in this repo.

* jquery.min.js v1.7.1 (http://jquery.com/)
* jquery-ui.min.js v1.8.17 (http://jqueryui.com/)
* jquery.cookie.js v1.4.1 (https://github.com/carhartl/jquery-cookie)
* normalize.css v2.0.1 (http://necolas.github.com/normalize.css/)
* jquery.ui.touch-punch.min.js v0.2.3 (https://github.com/furf/jquery-ui-touch-punch)

### Images

* media/light_noise_diagonal.png from http://subtlepatterns.com

### Fonts

* Open Sans and Chango from [Google Web Fonts](http://www.google.com/webfonts)

Copyright
---------

Copyright (C) 2012 Juan Lasheras (http://www.juanl.org).

Licensed under GPL, see COPYING.txt for details.

Send any questions or comments [here](http://twitter.com/jlas_).
