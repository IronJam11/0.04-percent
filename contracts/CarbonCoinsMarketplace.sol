// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// CarbonCoin Token
contract CarbonToken is ERC20, Ownable {
    constructor(address initialOwner) 
        ERC20("CarbonCoin", "CC")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// Main Marketplace Contract
contract CarbonMarketplace is ReentrancyGuard, Ownable {
    CarbonToken public carbonToken;
    uint256 public constant MOCK_CARBON_PRICE = 50; // Mock price per carbon credit in CC tokens

    struct Organization {
        string name;
        uint256 netEmission;
        string photoIpfsHash;
        bool isRegistered;
        uint256 balance;
        uint256 wallet;
    }

    enum RequestStatus { Pending, Approved, Declined }

    struct Request {
        uint256 id;
        address buyer; 
        address potentialSeller;
        uint256 amount;
        RequestStatus status;
    }

    struct Claim {
        uint256 id;
        address seller;
        uint256 coordinatesX;
        uint256 coordinatesY;
        uint256 acres;
        uint256 demandedTokens;
        uint256 eligibleTokens;
        string projectDetails;
        string projectName;
        uint256 timestamp;
        string[] photoIpfsHashes;
        uint256 startYear;
        ClaimStatus status;
    }

    enum ClaimStatus { Pending, Approved, Declined }

    mapping(address => Organization) public organizations;
    mapping(uint256 => Claim) public claims;
    mapping(uint256 => Request) public requests;
    
    uint256 public claimCounter;
    uint256 public requestCounter;

    event OrganizationRegistered(address indexed orgAddress, string name, string photoIpfsHash, uint256 balance, uint256 wallet);
    event ClaimSubmitted(uint256 indexed claimId, address indexed seller);
    event ClaimStatusUpdated(uint256 indexed claimId, ClaimStatus status, uint256 eligibleTokens);
    event CreditsPurchased(address indexed buyer, address indexed seller, uint256 amount);
    event RequestCreated(uint256 indexed requestId, address indexed buyer, address indexed potentialSeller, uint256 amount);
    event RequestStatusUpdated(uint256 indexed requestId, RequestStatus status);

    constructor(address initialOwner) Ownable(initialOwner) {
        carbonToken = new CarbonToken(address(this));
    }

    function registerOrganization(
        string memory _name,
        uint256 _netEmission,
        string memory _photoIpfsHash,
        uint256 _wallet,
        uint256 _balance
    ) external {
        require(!organizations[msg.sender].isRegistered, "Already registered");

        organizations[msg.sender] = Organization({
            name: _name,
            netEmission: _netEmission,
            photoIpfsHash: _photoIpfsHash,
            isRegistered: true,
            balance: _balance,
            wallet: _wallet
        });

        emit OrganizationRegistered(msg.sender, _name, _photoIpfsHash, _balance, _wallet);
    }

    function getUsersRequest(address user) external view returns (Request[] memory) {
        uint256 count;
        for (uint256 i = 0; i < requestCounter; i++) {
            if (requests[i].buyer == user || requests[i].potentialSeller == user) {
                count++;
            }
        }

        Request[] memory userRequests = new Request[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < requestCounter; i++) {
            if (requests[i].buyer == user || requests[i].potentialSeller == user) {
                userRequests[index] = requests[i];
                index++;
            }
        }

        return userRequests;
    }

    function createRequest(address _potentialSeller, uint256 _amount) external {
        require(organizations[msg.sender].isRegistered, "Buyer not registered");
        require(organizations[_potentialSeller].isRegistered, "Seller not registered");
        require(organizations[_potentialSeller].balance >= _amount, "Insufficient seller balance");

        uint256 requestId = requestCounter++;

        requests[requestId] = Request({
            id: requestId,
            buyer: msg.sender,
            potentialSeller: _potentialSeller,
            amount: _amount,
            status: RequestStatus.Pending
        });

        emit RequestCreated(requestId, msg.sender, _potentialSeller, _amount);
    }

    function handleRequest(uint256 _requestId, bool approve) external {
        // require(requests[_requestId].potentialSeller == msg.sender, "Unauthorized seller");
        require(requests[_requestId].status == RequestStatus.Pending, "Request already processed");

        if (approve) {
            uint256 amount = requests[_requestId].amount;
            address buyer = requests[_requestId].buyer;
            address seller = requests[_requestId].potentialSeller;

            require(organizations[buyer].wallet >= amount * MOCK_CARBON_PRICE, "Buyer lacks funds");
            require(organizations[seller].balance >= amount, "Seller lacks balance");

            // Transfer funds
            organizations[buyer].wallet -= amount * MOCK_CARBON_PRICE;
            organizations[seller].wallet += amount * MOCK_CARBON_PRICE;
            organizations[seller].balance -= amount;
            
            // Transfer tokens
            carbonToken.transferFrom(seller, buyer, amount);

            requests[_requestId].status = RequestStatus.Approved;
            emit CreditsPurchased(buyer, seller, amount);
        } else {
            requests[_requestId].status = RequestStatus.Declined;
        }

        emit RequestStatusUpdated(_requestId, requests[_requestId].status);
    }

    function submitClaim(
        uint256 _coordinatesX,
        uint256 _coordinatesY,
        uint256 _acres,
        uint256 _demandedTokens,
        string memory _projectDetails,
        string memory _projectName,
        string[] memory _photoIpfsHashes,
        uint256 startYear
    ) external {
        require(organizations[msg.sender].isRegistered, "Not registered");

        uint256 claimId = claimCounter++;

        claims[claimId] = Claim({
            id: claimId,
            seller: msg.sender,
            coordinatesX: _coordinatesX,
            coordinatesY: _coordinatesY,
            acres: _acres,
            demandedTokens: _demandedTokens,
            eligibleTokens: 0,
            projectDetails: _projectDetails,
            projectName: _projectName,
            timestamp: block.timestamp,
            photoIpfsHashes: _photoIpfsHashes,
            status: ClaimStatus.Pending,
            startYear: startYear
        });

        emit ClaimSubmitted(claimId, msg.sender);
    }

    function approveClaim(uint256 _claimId, uint256 _eligibleTokens) external onlyOwner {
        require(claims[_claimId].status == ClaimStatus.Pending, "Invalid claim status");
        require(_eligibleTokens <= claims[_claimId].demandedTokens, "Eligible tokens cannot exceed demanded tokens");

        claims[_claimId].status = ClaimStatus.Approved;
        claims[_claimId].eligibleTokens = _eligibleTokens;

        carbonToken.mint(claims[_claimId].seller, _eligibleTokens);
        organizations[claims[_claimId].seller].balance += _eligibleTokens;

        emit ClaimStatusUpdated(_claimId, ClaimStatus.Approved, _eligibleTokens);
    }

    function getOrganization(address _org) external view returns (Organization memory) {
        return organizations[_org];
    }

    function getBalance(address user) external view returns (uint256) {
        return carbonToken.balanceOf(user);
    }

    function getCarbonPrice() external pure returns (uint256) {
        return MOCK_CARBON_PRICE;
    }
}
// 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4