var fs = require('fs');

module.exports = {
  about: fs.readFileSync(__dirname + "/../partials/about.html", "utf8"),
  brainWallet: fs.readFileSync(__dirname + "/../partials/brainWallet.html", "utf8"),
  bulkWallets: fs.readFileSync(__dirname + "/../partials/bulkWallets.html", "utf8"),
  importWallet: fs.readFileSync(__dirname + "/../partials/importWallet.html", "utf8"),
  singleWallet: fs.readFileSync(__dirname + "/../partials/singleWallet.html", "utf8"),
  splitWallet: fs.readFileSync(__dirname + "/../partials/splitWallet.html", "utf8"),
  vanityWallet: fs.readFileSync(__dirname + "/../partials/vanityWallet.html", "utf8")
};
