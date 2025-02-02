import React, { useEffect, useState, useContext } from "react";
import { Web3Context } from "../../hooks/Web3hook";

const RequestsPage = () => {
    const statusArray = ["Pending", "Approved", "Declined"];
    const { walletAddress, contract } = useContext(Web3Context); // Web3 Context
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const MOCK_CARBON_PRICE = 50; // Mock price per carbon credit

    useEffect(() => {
        if (contract && walletAddress) {
            fetchRequests();
        }
    }, [contract, walletAddress]);

    const fetchRequests = async () => {
        try {
            if (!contract) {
                console.error("Contract not initialized");
                return;
            }
    
            const userRequests = await contract.getUsersRequest(walletAddress);
    
            const formattedRequests = userRequests.map((req) => ({
                id: req.id.toString(),
                buyer: req.buyer,
                seller: req.potentialSeller,
                amount: req.amount.toString(), // Convert BigInt to String
                status: req.status.toString(), // Convert Enum to String if needed
                price: (Number(req.amount) * MOCK_CARBON_PRICE).toString(), // Convert BigInt to Number before multiplying
            }));
    
            setRequests(formattedRequests);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching requests:", error);
            setLoading(false);
        }
    };
    

    const handleRequestAction = async (requestId, approve) => {
        try {
            if (!contract) {
                console.error("Contract not initialized");
                return;
            }

            const tx = await contract.handleRequest(requestId, approve);
            await tx.wait();
            alert(`Request ${approve ? "approved" : "declined"} successfully!`);
            fetchRequests(); // Refresh requests after action
        } catch (error) {
            console.error("Error handling request:", error);
            alert("You either dont have enough coins to give sir");
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-gray-100 py-8 px-4">
            <h2 className="text-3xl font-semibold mb-6 text-center">Your Requests</h2>

            {loading ? (
                <div className="bg-blue-600 text-white p-4 rounded-lg text-center">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="bg-gray-700 text-white p-4 rounded-lg text-center">No requests found.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <p className="text-xl font-semibold text-blue-500">Request number {req.id}</p>
                            <p className="text-gray-300">Buyer: {req.buyer}</p>
                            <p className="text-gray-300">Seller: {req.seller}</p>
                            <p className="text-gray-300">Amount: {req.amount} CC</p>
                            <p className="text-gray-300">Total Price: {req.price} CC</p>
                            <p className="text-gray-300">
                                Status: <span className="font-semibold">{statusArray[req.status]}</span>
                            </p>
                            {req.status === "0" && ( // Pending status
                                <div className="flex justify-between mt-4">
                                    <button
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                        onClick={() => handleRequestAction(req.id, true)}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                                        onClick={() => handleRequestAction(req.id, false)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RequestsPage;
