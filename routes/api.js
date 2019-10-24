let express = require('express'),
 router = express.Router(),
userController = require('../controllers/controller.js');

router.post('/', function(req, res, next) {
  res.status(500).send({status:false, 'error_string':'invalid request'})
});
router.post('/login', userController.login);
router.post('/signup', userController.start_signup);

module.exports = router;
