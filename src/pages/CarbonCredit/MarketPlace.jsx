import React, { useEffect, useState, useContext } from "react";
import { Web3Context } from "../../hooks/Web3hook";
import { useIPFS } from "../../context/IpfsContext"; // Import the IPFS context hook

const OrganisationMarketplace = () => {
    const { walletAddress, contract } = useContext(Web3Context); // Use global Web3 state
    const { getFile } = useIPFS(); // Use IPFS hook to get images
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [amount, setAmount] = useState("");

    useEffect(() => {
        if (contract) {
            fetchOrganizations();
        }
    }, [contract]);

    const fetchOrganizations = async () => {
        try {
            if (!contract) {
                console.error("Contract not initialized");
                return;
            }

            const orgs = await contract.queryFilter("OrganizationRegistered");

            const formattedOrgs = await Promise.all(
                orgs.map(async (event) => {
                    const photoUrl = await getFile(event.args.photoIpfsHash);
                    return {
                        address: event.args.orgAddress,
                        name: event.args.name,
                        photoUrl,
                        balance: event.args.balance.toString() || 0,
                        wallet: event.args.wallet.toString() || 0,
                    };
                })
            );

            setOrganizations(formattedOrgs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching organizations:", error);
            setLoading(false);
        }
    };

    const handleBorrowClick = (org) => {
        setSelectedOrg(org);
        setShowModal(true);
    };

    const handleAddRequest = () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            alert("Enter a valid amount");
            return;
        }

        console.log("Borrow request:", {
            walletAddress,
            orgAddress: selectedOrg.address,
            amount,
        });

        // Call the function to process the borrowing request
        borrowCarbonCoins(walletAddress, selectedOrg.address, amount);

        // Close the modal
        setShowModal(false);
        setAmount("");
    };

    const borrowCarbonCoins =  async (userWallet, orgAddress, amount) => {
        try{
        const tx = await contract.createRequest(
            orgAddress,
            amount
          );
          alert("Request created successfully!");
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    return (
        <div className="marketplace-container bg-gray-900 min-h-screen text-gray-100 py-8 px-4">
            <h2 className="text-3xl font-semibold mb-6 text-center">Organizations Marketplace</h2>

            {!walletAddress ? (
                <div className="bg-red-600 text-white p-4 rounded-lg text-center">
                    Connect your wallet to view organizations.
                </div>
            ) : loading ? (
                <div className="bg-blue-600 text-white p-4 rounded-lg text-center">
                    Loading organizations...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations.map((org, index) => (
                        <div
                            key={index}
                            className="organization-item bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center space-y-4"
                        >
                            {org.photoUrl && (
                                <img
                                    src={org.photoUrl}
                                    alt={org.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                                />
                            )}
                            <div className="text-center space-y-2">
                                <p className="text-xl font-semibold">{org.name}</p>
                                <p className="text-sm text-gray-400">Address: {org.address}</p>
                                <p className="text-sm text-gray-400">CarbonCoins: {org.balance} </p>
                            </div>
                            <button
                                className="w-full bg-blue-600 text-white py-3 rounded-lg transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={() => handleBorrowClick(org)}
                            >
                                Borrow
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && selectedOrg && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold mb-4 text-white">Borrow CarbonCoins</h2>
                        <p className="text-gray-300">Enter the number of CarbonCoins to borrow from {selectedOrg.name}:</p>
                        <input
                            type="number"
                            className="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex justify-between mt-4">
                            <button
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                onClick={handleAddRequest}
                            >
                                Add Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganisationMarketplace;
