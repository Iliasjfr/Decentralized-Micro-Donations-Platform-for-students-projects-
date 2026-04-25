module.exports = {
  contracts_build_directory: "./src/contracts",
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Ganache GUI (ou 8545 selon version CLI)
      network_id: "*"
    }
  },

  compilers: {
    solc: {
      version: "0.8.0"
    }
  }
};