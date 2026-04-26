// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IProjectContract
 * @dev Interface for calling into Person A's MicroDons (Project) contract.
 *      Person A deploys Project.sol first and provides the address.
 */
interface IProjectContract {
    struct Projet {
        uint256 id;
        address payable porteur;
        string titre;
        string description;
        uint256 objectifFinancement;
        uint256 montantCollecte;
        bool actif;
        bool fondsRetires;
    }

    /// @notice Returns full project details by ID
    function getDetails(uint256 id) external view returns (
        string memory titre,
        string memory description,
        address payable porteur,
        uint256 objectifFinancement,
        uint256 montantCollecte,
        uint256 deadline,
        bool actif,
        bool fondsRetires
    );

}

/**
 * @title Donation
 * @author Person B
 * @notice Handles all donation logic: accepting ETH, tracking donors,
 *         threshold checking, status flip to Funded, and secure withdrawal.
 * @dev Interacts with MicroDons (Project.sol) deployed by Person A.
 *      ReentrancyGuard pattern is implemented manually to avoid OZ dependency.
 */
contract Donation {

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Address of Person A's Project contract
    address public projectContractAddress;

    /// @notice Platform administrator (deployer)
    address public administrator;

    /// @dev Reentrancy guard flag
    bool private _locked;

    /// @dev projectId => total ETH raised through this contract
    mapping(uint256 => uint256) public totalRaisedPerProject;

    /// @dev projectId => donor address => cumulative amount donated
    mapping(uint256 => mapping(address => uint256)) public donationsBy;

    /// @dev projectId => ordered list of unique donors
    mapping(uint256 => address[]) private _donors;

    /// @dev projectId => donor => has donated (to avoid duplicate push)
    mapping(uint256 => mapping(address => bool)) private _hasDonated;

    /// @dev projectId => whether this contract has already marked it funded
    mapping(uint256 => bool) public markedFunded;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a donation is received
    event DonationReceived(
        uint256 indexed projectId,
        address indexed donor,
        uint256 amount,
        uint256 newTotal
    );

    /// @notice Emitted when the project owner withdraws funds
    event FundsWithdrawn(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when a project crosses its funding threshold
    event ProjectFunded(
        uint256 indexed projectId,
        uint256 totalRaised
    );

    /// @notice Emitted when a donor is refunded (project failed)
    event DonorRefunded(
        uint256 indexed projectId,
        address indexed donor,
        uint256 amount
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    /// @dev Simple reentrancy guard – checks-effects-interactions pattern
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyAdmin() {
        require(msg.sender == administrator, "Not administrator");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @notice Deploy with the address of Person A's already-deployed Project contract.
     * @param _projectContractAddress Address of MicroDons (Project.sol)
     */
    constructor(address _projectContractAddress) {
        require(_projectContractAddress != address(0), "Invalid project address");
        projectContractAddress = _projectContractAddress;
        administrator = msg.sender;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Donate ETH to a specific project.
     * @dev Checks project is active, records donation, checks funding threshold,
     *      and emits events. Uses nonReentrant for safety.
     * @param projectId The ID of the project to donate to
     */
    function donate(uint256 projectId) external payable nonReentrant {
        require(msg.value > 0, "Donation must be > 0");

        // Read project state from Person A's contract via getDetails()
        (
            ,                        // titre  (ignored)
            ,                        // description (ignored)
            address payable porteur,
            uint256 objectif,
            uint256 montantCollecte,
            ,                        // deadline (ignored)
            bool actif,
            bool fondsRetires
        ) = IProjectContract(projectContractAddress).getDetails(projectId);

        require(porteur != address(0), "Project does not exist");
        require(actif, "Project is not active");
        require(!fondsRetires, "Funds already withdrawn");
        require(msg.sender != porteur, "Project owner cannot donate");

        // ── Effects ──
        if (!_hasDonated[projectId][msg.sender]) {
            _hasDonated[projectId][msg.sender] = true;
            _donors[projectId].push(msg.sender);
        }

        donationsBy[projectId][msg.sender] += msg.value;
        totalRaisedPerProject[projectId] += msg.value;

        uint256 newTotal = totalRaisedPerProject[projectId];

        emit DonationReceived(projectId, msg.sender, msg.value, newTotal);

        // ── Threshold check ──
        // montantCollecte is from Project.sol storage; we add our tracked amount
        uint256 combinedTotal = montantCollecte + newTotal;
        if (!markedFunded[projectId] && combinedTotal >= objectif) {
            markedFunded[projectId] = true;
            emit ProjectFunded(projectId, combinedTotal);
        }
    }

    /**
     * @notice Withdraw collected funds for a project. Only callable by the project owner.
     * @dev Uses Checks-Effects-Interactions. Sends all ETH held for this project.
     * @param projectId The project whose funds to withdraw
     */
    function withdraw(uint256 projectId) external nonReentrant {
        (
            ,                        // titre (ignored)
            ,                        // description (ignored)
            address payable porteur,
            ,                        // objectif (ignored)
            ,                        // montantCollecte (ignored)
            ,                        // deadline (ignored)
            bool actif,
            bool fondsRetires
        ) = IProjectContract(projectContractAddress).getDetails(projectId);

        require(porteur != address(0), "Project does not exist");
        require(msg.sender == porteur, "Only project owner can withdraw");
        require(actif, "Project is not active");
        require(!fondsRetires, "Already withdrawn");
        require(markedFunded[projectId], "Funding threshold not reached yet");

        uint256 amount = totalRaisedPerProject[projectId];
        require(amount > 0, "Nothing to withdraw");

        // ── Effects ──
        totalRaisedPerProject[projectId] = 0;

        emit FundsWithdrawn(projectId, porteur, amount);

        // ── Interaction ──
        (bool success, ) = porteur.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @notice Returns donor history for a project (address + amount pairs).
     * @param projectId The project to query
     * @return donors_ Array of donor addresses
     * @return amounts_ Corresponding donation amounts
     */
    function getDonorsForProject(uint256 projectId)
        external
        view
        returns (address[] memory donors_, uint256[] memory amounts_)
    {
        address[] storage d = _donors[projectId];
        uint256 len = d.length;
        donors_ = new address[](len);
        amounts_ = new uint256[](len);
        for (uint256 i = 0; i < len; ) {
            donors_[i] = d[i];
            amounts_[i] = donationsBy[projectId][d[i]];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns all project IDs that a given donor has contributed to.
     * @dev Iterates over provided project ID range – caller supplies bounds
     *      to avoid unbounded loops. Gas-safe for off-chain use.
     * @param donor The donor address to look up
     * @param fromId Start of project ID range (inclusive)
     * @param toId   End of project ID range (inclusive)
     * @return projectIds Array of project IDs the donor contributed to
     */
    function getProjectsDonatedByUser(
        address donor,
        uint256 fromId,
        uint256 toId
    ) external view returns (uint256[] memory projectIds) {
        require(toId >= fromId, "Invalid range");
        uint256 range = toId - fromId + 1;
        uint256[] memory temp = new uint256[](range);
        uint256 count;
        for (uint256 i = fromId; i <= toId; ) {
            if (_hasDonated[i][donor]) {
                temp[count] = i;
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        projectIds = new uint256[](count);
        for (uint256 j = 0; j < count; ) {
            projectIds[j] = temp[j];
            unchecked { ++j; }
        }
    }

    /**
     * @notice Returns true if a project has reached its funding goal (via this contract).
     * @param projectId The project to check
     */
    function isFunded(uint256 projectId) external view returns (bool) {
        return markedFunded[projectId];
    }

    /**
     * @notice Get the amount a specific donor gave to a specific project.
     * @param projectId The project ID
     * @param donor The donor address
     */
    function getDonationAmount(uint256 projectId, address donor)
        external
        view
        returns (uint256)
    {
        return donationsBy[projectId][donor];
    }

    /**
     * @notice Admin-only function to update the project contract address if redeployed.
     * @param newAddress New address of the Project contract
     */
    function updateProjectContract(address newAddress) external onlyAdmin {
        require(newAddress != address(0), "Invalid address");
        projectContractAddress = newAddress;
    }

    /// @notice Reject plain ETH transfers (no projectId)
    receive() external payable {
        revert("Use donate() with a projectId");
    }

    fallback() external payable {
        revert("Use donate() with a projectId");
    }
}
