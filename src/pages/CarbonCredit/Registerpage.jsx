import React, { useState, useContext } from "react";
import { Web3Context } from "../../hooks/Web3hook";
import { useIPFS } from "../../context/IpfsContext"; // Import the IPFS context hook
import metamaskLogo from "../../assets/metamask-logo.png"; // Adjust this path based on your file location

export default function OrganisationRegisterPage() {
  const { walletAddress, contract, connectWallet, disconnectWallet, error: web3Error } = useContext(Web3Context);
  const { uploadFile, error: ipfsError } = useIPFS(); // Use the IPFS context

  const [formData, setFormData] = useState({
    name: "",
    netEmission: "",
    photo: null, // Changed from photoIpfsHash to photo
    balance: 0,
    wallet: 10000,
    
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);

    try {
      if (!contract) {
        throw new Error("Contract not initialized. Try reconnecting the wallet.");
      }

      // Upload photo to IPFS if it exists
      let photoIpfsHash = "";
      if (formData.photo) {
        try {
          photoIpfsHash = await uploadFile(formData.photo);
          if (!photoIpfsHash) {
            throw new Error("Failed to upload photo to IPFS");
          }
        } catch (ipfsError) {
          throw new Error(`IPFS Upload Error: ${ipfsError.message}`);
        }
      }

      alert("ipfsHash: " + photoIpfsHash);
      const tx = await contract.registerOrganization(
        formData.name,
        formData.netEmission,
        photoIpfsHash,
        formData.wallet,
        formData.balance
      );

      await tx.wait();
      alert("Organization registered successfully!");

      // Clear form after successful registration
      setFormData({
        name: "",
        netEmission: "",
        photo: null
      });

    } catch (error) {
      console.error("Registration error:", error);
      setLocalError(error.reason || error.message || "Failed to register organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic file validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setLocalError("File size too large. Maximum size is 10MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setLocalError("Only image files are allowed.");
        return;
      }
      setLocalError("");
      setFormData({ ...formData, photo: file });
    }
  };

  const renderWalletButton = () => (
    <div className="wallet-connect-container bg-gray-800 p-6 rounded-xl shadow-lg text-white">
      <div className="wallet-icon text-4xl mb-4">
        <img src={metamaskLogo} alt="MetaMask Logo" className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-gray-400 mb-4">Please connect your MetaMask wallet to continue</p>
      <button onClick={connectWallet} className="w-full bg-blue-600 text-white py-3 rounded-lg transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Connect MetaMask
      </button>
    </div>
  );

  const renderWalletInfo = () => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-white mb-6">
      <span className="text-lg">Connected Wallet</span>
      <div className="text-sm font-semibold mt-2">{walletAddress}</div>
      <button onClick={disconnectWallet} className="mt-4 w-full bg-red-600 text-white py-3 rounded-lg transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
        Disconnect
      </button>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="registration-form bg-gray-800 p-8 rounded-xl shadow-xl text-white">
      {renderWalletInfo()}

      <div className="form-group mb-4">
        <label className="block text-sm font-semibold">Organization Name</label>
        <input
          type="text"
          required
          placeholder="Enter organization name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="form-group mb-4">
        <label className="block text-sm font-semibold">Net Emission (tons CO2)</label>
        <input
          type="number"
          required
          placeholder="Enter net emission"
          value={formData.netEmission}
          onChange={(e) => setFormData({ ...formData, netEmission: e.target.value })}
          className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="form-group mb-4">
        <label className="block text-sm font-semibold">Organization Photo</label>
        <div className="file-input-wrapper mt-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none"
          />
          {formData.photo && (
            <div className="file-info mt-2 text-sm text-gray-400">
              Selected: {formData.photo.name}
            </div>
          )}
        </div>
      </div>

      {(localError || web3Error || ipfsError) && (
        <div className="error-message text-red-500 text-sm mb-4">
          {localError || web3Error || ipfsError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`submit-button w-full py-3 mt-6 rounded-lg text-white ${loading ? "bg-gray-600" : "bg-blue-600"} transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {loading ? "Registering..." : "Register Organization"}
      </button>
    </form>
  );

  return (
    <div className="register-page bg-gray-900 min-h-screen flex items-center justify-center text-gray-100">
      <div className="register-container bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h1 className="text-3xl font-semibold mb-8">Register Organization</h1>
        {!walletAddress ? renderWalletButton() : renderForm()}
      </div>
    </div>
  );
}
