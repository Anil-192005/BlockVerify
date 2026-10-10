// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockVerify - Blockchain-Based Document Authentication System
 * @notice Decentralized registry for tamper-proof document hash verification on Ethereum Sepolia
 * @dev Stores cryptographic hashes (SHA-256) and IPFS metadata instead of raw files
 */
contract BlockVerify {
    // Contract owner / super-admin
    address public owner;

    // Document structure representing an authenticated credential
    struct Document {
        bytes32 documentHash;      // SHA-256 digest of original document
        string documentCID;       // IPFS Content Identifier (CID) for storage
        string documentId;        // Unique business identifier (e.g. CERT-2026-0001)
        string documentType;      // Category (e.g. Degree Certificate, Land Record)
        string recipientName;     // Student / Beneficiary Name (e.g. Anil M)
        string organizationName;  // Issuing Authority (e.g. ABC Engineering College)
        address issuer;           // Ethereum wallet of the issuing organization
        uint256 timestamp;        // Unix timestamp of registration
        bool revoked;             // Revocation flag
        string revocationReason;  // Reason if revoked (fraud, error, expiry)
        uint256 revokedAt;        // Unix timestamp when revoked
    }

    // Mapping from documentHash (bytes32) to Document record
    mapping(bytes32 => Document) public documentsByHash;

    // Mapping from human-readable documentId (e.g., "CERT-2026-0001") to documentHash
    mapping(string => bytes32) public documentIdToHash;

    // List of authorized issuer wallets
    mapping(address => bool) public authorizedIssuers;
    mapping(address => string) public issuerOrganizationNames;

    // Array of all registered document hashes for enumeration
    bytes32[] public allDocumentHashes;

    // Events for real-time monitoring and analytics
    event DocumentRegistered(
        string indexed documentId,
        bytes32 indexed documentHash,
        address indexed issuer,
        string documentCID,
        string documentType,
        string recipientName,
        uint256 timestamp
    );

    event DocumentRevoked(
        string indexed documentId,
        bytes32 indexed documentHash,
        address indexed issuer,
        string reason,
        uint256 revokedAt
    );

    event IssuerAuthorized(address indexed issuerAddress, string organizationName);
    event IssuerRevoked(address indexed issuerAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "BlockVerify: Only contract owner can execute this");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "BlockVerify: Only authorized issuers can perform this action"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        issuerOrganizationNames[msg.sender] = "Master Root Authority";
        emit IssuerAuthorized(msg.sender, "Master Root Authority");
    }

    /**
     * @notice Authorize an educational institution, government body, or enterprise as an Issuer
     */
    function authorizeIssuer(address _issuer, string memory _orgName) external onlyOwner {
        require(_issuer != address(0), "Invalid issuer address");
        authorizedIssuers[_issuer] = true;
        issuerOrganizationNames[_issuer] = _orgName;
        emit IssuerAuthorized(_issuer, _orgName);
    }

    /**
     * @notice Revoke issuer rights
     */
    function revokeIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    /**
     * @notice Register a newly issued document on the Ethereum blockchain
     * @param _documentHash SHA-256 hash formatted as bytes32
     * @param _documentCID IPFS Content ID where encrypted/public PDF is mirrored
     * @param _documentId Unique reference ID (e.g. CERT-2026-0001)
     * @param _documentType Document category
     * @param _recipientName Name of recipient
     * @param _organizationName Name of the issuing entity
     */
    function registerDocument(
        bytes32 _documentHash,
        string memory _documentCID,
        string memory _documentId,
        string memory _documentType,
        string memory _recipientName,
        string memory _organizationName
    ) external onlyAuthorizedIssuer {
        require(_documentHash != bytes32(0), "Invalid document hash");
        require(bytes(_documentId).length > 0, "Document ID cannot be empty");
        require(documentsByHash[_documentHash].timestamp == 0, "Document hash is already registered");
        require(documentIdToHash[_documentId] == bytes32(0), "Document ID is already registered");

        Document memory newDoc = Document({
            documentHash: _documentHash,
            documentCID: _documentCID,
            documentId: _documentId,
            documentType: _documentType,
            recipientName: _recipientName,
            organizationName: _organizationName,
            issuer: msg.sender,
            timestamp: block.timestamp,
            revoked: false,
            revocationReason: "",
            revokedAt: 0
        });

        documentsByHash[_documentHash] = newDoc;
        documentIdToHash[_documentId] = _documentHash;
        allDocumentHashes.push(_documentHash);

        emit DocumentRegistered(
            _documentId,
            _documentHash,
            msg.sender,
            _documentCID,
            _documentType,
            _recipientName,
            block.timestamp
        );
    }

    /**
     * @notice Instant verification of a document by its cryptographic SHA-256 hash
     * @param _documentHash SHA-256 hash of the uploaded file to check
     * @return exists Whether hash exists on blockchain
     * @return isValid True if document exists and is NOT revoked
     * @return isRevoked True if marked as revoked
     * @return documentId Unique ID of document
     * @return recipientName Name of recipient
     * @return organizationName Issuing institution
     * @return documentCID IPFS CID
     * @return timestamp Timestamp when recorded
     */
    function verifyDocument(bytes32 _documentHash)
        external
        view
        returns (
            bool exists,
            bool isValid,
            bool isRevoked,
            string memory documentId,
            string memory recipientName,
            string memory organizationName,
            string memory documentCID,
            uint256 timestamp
        )
    {
        Document memory doc = documentsByHash[_documentHash];
        if (doc.timestamp == 0) {
            return (false, false, false, "", "", "", "", 0);
        }

        return (
            true,
            !doc.revoked,
            doc.revoked,
            doc.documentId,
            doc.recipientName,
            doc.organizationName,
            doc.documentCID,
            doc.timestamp
        );
    }

    /**
     * @notice Verify document by human-readable Document ID
     */
    function verifyDocumentById(string memory _documentId)
        external
        view
        returns (
            bool exists,
            bool isValid,
            bool isRevoked,
            bytes32 documentHash,
            string memory recipientName,
            string memory organizationName,
            string memory documentCID,
            uint256 timestamp
        )
    {
        bytes32 hashVal = documentIdToHash[_documentId];
        if (hashVal == bytes32(0)) {
            return (false, false, false, bytes32(0), "", "", "", 0);
        }

        Document memory doc = documentsByHash[hashVal];
        return (
            true,
            !doc.revoked,
            doc.revoked,
            doc.documentHash,
            doc.recipientName,
            doc.organizationName,
            doc.documentCID,
            doc.timestamp
        );
    }

    /**
     * @notice Check if document hash is valid and not revoked
     */
    function isDocumentValid(bytes32 _documentHash) external view returns (bool) {
        Document memory doc = documentsByHash[_documentHash];
        return (doc.timestamp != 0 && !doc.revoked);
    }

    /**
     * @notice Fetch full details for a document by hash
     */
    function getDocument(bytes32 _documentHash) external view returns (Document memory) {
        require(documentsByHash[_documentHash].timestamp != 0, "Document not found");
        return documentsByHash[_documentHash];
    }

    /**
     * @notice Revoke an issued document (can only be performed by original issuer or owner)
     * @param _documentId The ID of the document to revoke
     * @param _reason Justification for revocation
     */
    function revokeDocument(string memory _documentId, string memory _reason) external {
        bytes32 hashVal = documentIdToHash[_documentId];
        require(hashVal != bytes32(0), "Document does not exist");

        Document storage doc = documentsByHash[hashVal];
        require(
            msg.sender == owner || msg.sender == doc.issuer,
            "BlockVerify: Only original issuer or contract owner can revoke"
        );
        require(!doc.revoked, "Document is already revoked");

        doc.revoked = true;
        doc.revocationReason = _reason;
        doc.revokedAt = block.timestamp;

        emit DocumentRevoked(_documentId, hashVal, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Returns total number of registered documents on the blockchain
     */
    function getTotalDocuments() external view returns (uint256) {
        return allDocumentHashes.length;
    }
}
