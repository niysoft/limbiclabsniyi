var express = require('express');
var router = express.Router();
router.get('/', function (req, res) {
  res.status(SUCCESS_RESPONSE_CODE).render('login')
});
router.get('/:page/', function (req, res) {
  let page = req.params.page;
  let url = req.protocol + "://" + req.headers.host;
  switch (page) {
    case 'login':
      res.status(SUCCESS_RESPONSE_CODE).render('login')
      break

    case 'logout':
      res.clearCookie('userData', {path: '/'})
      res.clearCookie('accessToken', {path: '/'})
      res.clearCookie('gameId', {path: '/'})
      res.clearCookie('userId', {path: '/'})
      res.status(SUCCESS_RESPONSE_CODE).redirect('/login')
      break

    case 'signup':
      res.status(SUCCESS_RESPONSE_CODE).render('signup')
      break

    case 'speak':
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      try {
        let userDetails = JSON.parse(req.cookies.userData)
        let code = userDetails.code
        if (code == 200) {
          res.render('speak', {userData: userDetails});
        } else {
          res.status(SUCCESS_RESPONSE_CODE).redirect('/login')// res.redirect('/login', {});
        }
      } catch (e) {
        res.status(SUCCESS_RESPONSE_CODE).redirect('/login')
      }
      break

    default:
      res.status(SUCCESS_RESPONSE_CODE).redirect('/login')
      break
  }
});

module.exports = router;
