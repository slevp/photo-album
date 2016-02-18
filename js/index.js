(function () {
  //"use strict";
  if(!Date.now)Date.now=function(){return(new Date).getTime()};(function(){var n=["webkit","moz"];for(var e=0;e<n.length&&!window.requestAnimationFrame;++e){var i=n[e];window.requestAnimationFrame=window[i+"RequestAnimationFrame"];window.cancelAnimationFrame=window[i+"CancelAnimationFrame"]||window[i+"CancelRequestAnimationFrame"]}if(/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent)||!window.requestAnimationFrame||!window.cancelAnimationFrame){var a=0;window.requestAnimationFrame=function(n){var e=Date.now();var i=Math.max(a+16,e);return setTimeout(function(){n(a=i)},i-e)};window.cancelAnimationFrame=clearTimeout}})();

  document.addEventListener('touchmove', function (e) {e.preventDefault();}, false);

  $(document).ready(function () {
    var RAF = window.requestAnimationFrame;
    var preLoadPhotoReady = false;
    var max = 28, current = 1; // 最大相片数和当前索引
    var windowWidth = $(window).width(), windowHeight = $(window).height();
    /*
    // 以下是舞台资源
    var stageImages = [
      '../img/bg1.jpg', '../img/button_03.png', '../img/bg1.jpg'
    ];*/
    var loadedPhotos = [];
    var classNames = ['l3', 'l2', 'l1', 'current', 'r1', 'r2', 'r3']; // 相片的class名称
    var endCurrPage, endNextPage, isAnimating;
    endCurrPage = endNextPage = isAnimating = false;
    var showingDetail = false;

    // 加载图片
    function loadImage(src, cb) {
      var img = new Image();
      img.src = src;

      if (img.complete) {
        // 在缓存中
        handler();
      } else {
        img.onload = function () { handler(); };
        img.onerror = function () { handler('loading err'); };
      }

      function handler(err) {
        cb(err, img);
      }
    }

    // 根据索引加载相片
    function loadPhotoByIndex(index, cb) {
      index = parseInt(index);
      var prefix =  index < 10
              ? '00'
              : index < 100
                ? '0'
                : '';
      var img = loadedPhotos[index];
      if (img) return cb(null, img);

      loadImage('../img/' + (prefix + index) + '.jpg', function (err, img) {
        if (err) return cb(err);

        loadedPhotos[index] = img;
        cb(null, img);
      });
    }

    /*
    // 加载舞台资源
    function loadStageImages(cb) {
      var tasks = [];

      async.each(stageImages, function (src, i) {
        tasks.push(function (cb) {
          loadImage(src, function (err, img) {
            if (err) return cb(err);
            stageImages[i] = img;
            cb(null, img);
          });
        })
      });
      async.parallel(tasks, cb);
    }*/

    // 加载指定索引的相片
    function loadPhotos(indexes, cb) {
      var tasks = [];

      async.each(indexes, function (index) {
        tasks.push(function (cb) {
          loadPhotoByIndex(index, cb);
        })
      });
      async.parallel(tasks, cb);
    }

    // 切换页面
    function changePage($currPage, $nextPage) {
      if (isAnimating) return;
      isAnimating = true;

      $currPage.addClass( 'pt-page-rotateFall page-ontop' ).on( 'webkitAnimationEnd', function() {
        $currPage.off( 'webkitAnimationEnd' );
        endCurrPage = true;
        if( endNextPage ) {
          onEndAnimation( $currPage, $nextPage );
        }
      } );

      $nextPage.addClass( 'pt-page-scaleUp active' ).on( 'webkitAnimationEnd', function() {
        $nextPage.off( 'webkitAnimationEnd' );
        endNextPage = true;
        if( endCurrPage ) {
          onEndAnimation( $currPage, $nextPage );
        }
      } );

      function onEndAnimation( $outpage, $inpage ) {
        endCurrPage = false;
        endNextPage = false;
        isAnimating = false;

        $outpage.removeClass('pt-page-rotateFall page-ontop active');
        $inpage.removeClass('pt-page-scaleUp');
      }
    }

    // 确保索引是正确的
    function checkIndex(index) {
      return index > 0
          ? index > max
            ? index - max
            : index
          : max + index;
    }

    // 切换相片
    function changePhoto(isPrev) {
      if (showingDetail || isAnimating || !preLoadPhotoReady) return;
      isAnimating = true;

      isPrev = !!isPrev;
      //if (Math.abs(toIndex) > 2 || toIndex == 0) return console.warn('invalid index.');

      // 判断图片是否加载完成
      var requireIndex = checkIndex(isPrev ? current - 4 : current + 4);
      var requirePhoto = loadedPhotos[requireIndex];
      if (!requirePhoto) return console.warn('Photo' + requireIndex + ' has not been loaded.');

      var $allPhotoEl = $('.all-photos');
      var $removeEl = $('.photo').eq(isPrev ? -1 : 0);

      if (isPrev) {
        $allPhotoEl.prepend('<div class="photo l3"></div>');
      } else {
        $allPhotoEl.append('<div class="photo r3"></div>');
      }
      $removeEl.remove();

      RAF(function () {
        var $newEl = $('.photo').eq(isPrev ? 0 : -1);
        $newEl.append(requirePhoto);
        $('.all-photos>.photo').each(function (i, el) {
          $(el).attr('class', 'photo ' + classNames[i]);
        });
      });

      current = checkIndex(isPrev ? current - 1 : current + 1);
      preLoadPhoto(); // 预加载照片
      setTimeout(function () {
        isAnimating = false;
      }, 400);
    }

    // 预加载相片
    function preLoadPhoto() {
      preLoadPhotoReady = false;
      var prev = checkIndex(current - 4);
      var next = checkIndex(current + 4);

      loadPhotos([prev, next], function (err) {
        preLoadPhotoReady = true;
        if (err) console.error('preLoadPhoto err', err);
      });
    }

    function showDetail($el) {
      var width = $el.width(), height = $el.height();
      var pOffset = $el.parent().offset();
      var yRate = windowHeight / height, xRate = windowWidth / width;

      $el.addClass('scaling');
      if ((width / height) > (windowWidth / windowHeight)) {
        // 胖一点
        $el.css('-webkit-transform', 'scale(' + (xRate * 0.97) + ') translateY(' + ((windowHeight - height) / 2 - pOffset.top) + 'px)');
      } else {
        // 瘦一点
        $el.css('-webkit-transform', 'scale(' + (yRate * 0.97) + ') translateX(' + ((windowWidth - width) / 2 - pOffset.left) + 'px)');
      }

      $('#detail-mask').show().animate({opacity: 1}, 600, 'linear', function () {
        $(this).show();
      });
    }

    function closeDetail($el) {
      $el.css('-webkit-transform', '');
      $('#detail-mask').animate({opacity: 0}, 600, 'linear', function () {
        $(this).hide();
        $el.removeClass('scaling');
      });
    }

    function snowFall() {
      var SCREEN_WIDTH = window.innerWidth;
      var SCREEN_HEIGHT = window.innerHeight;
      var container;
      var particle;
      var camera;
      var scene;
      var renderer;
      var mouseX = 0;
      var mouseY = 0;
      var windowHalfX = window.innerWidth / 2;
      var windowHalfY = window.innerHeight / 2;
      var particles = [];
      var particleImage = new Image();//THREE.ImageUtils.loadTexture( "img/ParticleSmoke.png" );
      particleImage.src = '../img/flower_03.png';

      function init() {
        container = $('#page1')[0];

        camera = new THREE.PerspectiveCamera( 75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000 );
        camera.position.z = 1000;

        scene = new THREE.Scene();
        scene.add(camera);

        renderer = new THREE.CanvasRenderer();
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        var material = new THREE.ParticleBasicMaterial( { map: new THREE.Texture(particleImage) } );

        for (var i = 0; i < 50; i++) {
          particle = new Particle3D( material);
          particle.position.x = Math.random() * 2000 - 1000;
          particle.position.y = Math.random() * 2000 - 1000;
          particle.position.z = Math.random() * 2000 - 1000;
          particle.scale.x = particle.scale.y =  1;
          scene.add( particle );

          particles.push(particle);
        }
        container.appendChild( renderer.domElement );

        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );

        setInterval( loop, 1000 / 60 );
      }

      function onDocumentMouseMove( event ) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
      }

      function onDocumentTouchStart( event ) {
        if ( event.touches.length == 1 ) {
          event.preventDefault();
          mouseX = event.touches[ 0 ].pageX - windowHalfX;
          mouseY = event.touches[ 0 ].pageY - windowHalfY;
        }
      }

      function onDocumentTouchMove( event ) {
        if ( event.touches.length == 1 ) {
          event.preventDefault();
          mouseX = event.touches[ 0 ].pageX - windowHalfX;
          mouseY = event.touches[ 0 ].pageY - windowHalfY;
        }
      }

      function loop() {
        for(var i = 0; i<particles.length; i++) {
          var particle = particles[i];
          particle.updatePhysics();

          with (particle.position) {
            if(y<-1000) y+=2000;
            if(x>1000) x-=2000;
            else if(x<-1000) x+=2000;
            if(z>1000) z-=2000;
            else if(z<-1000) z+=2000;
          }
        }

        camera.position.x += ( mouseX - camera.position.x ) * 0.05;
        camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
        camera.lookAt(scene.position);
        renderer.render( scene, camera );
      }

      init();
    }

    (function start() {
      /*
      loadStageImages(function (err) {
        if (err) {
          return alert('加载资源出错，请再次尝试！');
        }
        triggerEvent(document, 'stageImagesLoaded');
      });*/
      document.addEventListener('stageImagesLoaded', function (e) {
        // 加载第一页的照片
        loadPhotos([max - 2, max - 1, max, 1, 2, 3, 4], function (err, images) {
          if (err) return console.log(err);

          $('#zhufu-btn').tap(function () {
            var $currPage = $('#page1');
            var $nextPage = $('#page2');

            changePage($currPage, $nextPage);

            var timeouts = [1000, 600, 600, 0, 600, 600, 1000];
            $('.all-photos>.photo').each(function (i, el) {
              setTimeout(function () {
                $(el).attr('class', 'photo ' + classNames[i]);
              }, timeouts[i] + 1000);
            });

            // 延迟注册事件
            setTimeout(function () {
              $('#page2').swipeLeft(function (e) {
                changePhoto(false);
              });
              $('#page2').swipeRight(function (e) {
                changePhoto(true);
              });
              $('.all-photos').on('tap', '.current', function (e) {
                // 放大查看
                if (showingDetail) {
                  closeDetail($(this));
                } else {
                  showDetail($(this));
                }
                showingDetail = !showingDetail;
              });
              $('.all-photos').on('tap', '.l2, .l1', function (e) {
                changePhoto(true);
              });
              $('.all-photos').on('tap', '.r2, .r1', function (e) {
                changePhoto(false);
              });
            }, 2000);
          });
          // 追加图片
          $('.all-photos>.photo').each(function (i, el) {
            $(el).append(images[i]);
          });
          // 预加载
          preLoadPhoto();
        });

        setTimeout(function () {
          $('#zhufu-btn').addClass('scale-in');

          snowFall();
        }, 500);
      }, false);

      triggerEvent(document, 'stageImagesLoaded');
    })();
  })

  // Util
  function triggerEvent(element, name, opts) {
    var event = new CustomEvent(name, {
      detail: opts
    });
    element.dispatchEvent(event);
  }
})();