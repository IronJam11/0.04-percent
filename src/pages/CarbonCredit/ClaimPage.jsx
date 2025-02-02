import { useState, useContext } from 'react';
import { ethers } from 'ethers';
import { useIPFS } from '../../context/IpfsContext';
import { Web3Context } from '../../hooks/Web3hook';
import { parse } from 'dotenv';
import axios from 'axios';

const OrganisationClaimPage = () => {
  const { walletAddress, contract, connectWallet, organization, error } = useContext(Web3Context); // Use global Web3 state
    const { uploadFile, error: ipfsError } = useIPFS(); // Use the IPFS context

  const [formData, setFormData] = useState({
    coordinatesX: '',
    coordinatesY: '',
    acres: '',
    demandedTokens: '',
    projectDetails: '',
    projectName: '',
    photoIpfsHash: null,
  });
  const [localError, setLocalError] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    let photoIpfsHash = "";
      if (formData.photoIpfsHash) {
        try {
          photoIpfsHash = await uploadFile(formData.photoIpfsHash);
          if (!photoIpfsHash) {
            throw new Error("Failed to upload photo to IPFS");
          }
        } catch (ipfsError) {
          throw new Error(`IPFS Upload Error: ${ipfsError.message}`);
        }
      }
      
      alert("ipfsHash: " + photoIpfsHash);
      const photos = photoIpfsHash

    try {
      if (!contract) throw new Error("Contract not initialized. Try reconnecting the wallet.");
      if (!organization?.isRegistered) throw new Error("Organization not registered.");

      const tx = await contract.submitClaim(
        parseInt(formData.coordinatesX),
        parseInt(formData.coordinatesY),
        parseInt(formData.acres),
        ethers.parseUnits(String(formData.demandedTokens), 18), // Ensure it's a string
        formData.projectDetails,
        formData.projectName,
        [photoIpfsHash],
        2023
      );

      const receipt = await tx.wait(); // Wait for transaction confirmation

      // 🔹 Extract the claim ID from the event
      const event = receipt.logs.find(log => log.fragment.name === "ClaimSubmitted");
      let expectedTokens = 0;
      const claimId = event.args.claimId.toString();
      try{
        const response = await axios.post('http://127.0.0.1:5000/predict',{
          "latitude": formData.coordinatesX,
          "longitude": formData.coordinatesY,
          "area": formData.acres,
          "year": 2020
        })
        expectedTokens = Math.floor(parseFloat(response.data['prediction'])); // ✅ Converts float to int
        alert(expectedTokens);
      }
      catch(error){ 
        alert("Internal Sever error! Try again later");
        console.log(error)
      }
   
      if(expectedTokens > formData.demandedTokens) expectedTokens = formData.demandedTokens;
      const expectedTokensWei = ethers.parseUnits(String(expectedTokens), 18);
      const tx2 = await contract.approveClaim(claimId,expectedTokensWei);
      const receipt2 = await tx2.wait(); 
      alert("Claim approved !!, coins granted: " + expectedTokens);
      console.error('Claim submission error:', error);
      setLocalError(error.reason || error.message);
    } catch (error) {
      console.error('Claim submission error:', error);
      setLocalError(error.reason || error.message);
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
      setFormData({ ...formData, photoIpfsHash: file });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h2 className="text-3xl font-semibold text-center mb-8">Submit Carbon Credit Claim</h2>

      {!walletAddress ? (
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 w-full mb-8"
          onClick={connectWallet}
        >
          Connect Wallet to Submit Claim
        </button>
      ) : (
        <div className="wallet-info text-center mb-8">
          <p className="text-lg">Connected as: {walletAddress}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Coordinates X:</label>
          <input
            type="number"
            name="coordinatesX"
            value={formData.coordinatesX}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Coordinates Y:</label>
          <input
            type="number"
            name="coordinatesY"
            value={formData.coordinatesY}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Acres:</label>
          <input
            type="number"
            name="acres"
            value={formData.acres}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Requested Tokens:</label>
          <input
            type="number"
            name="demandedTokens"
            value={formData.demandedTokens}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Project Name:</label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Project Details:</label>
          <textarea
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="block text-lg mb-2">Project Photo:</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*"
            className="w-full text-white bg-gray-700 p-2 rounded-md file:mr-2 file:px-4 file:py-2 file:bg-blue-600 file:text-white file:rounded-md hover:file:bg-blue-700"
          />
        
        </div>

        {localError && <div className="error text-red-500 text-center mb-4">{localError}</div>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 w-full"
        >
          Submit Claim
        </button>
      </form>
    </div>
  );
};

export default OrganisationClaimPage;