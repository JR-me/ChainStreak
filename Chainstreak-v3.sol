// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title Chainstreak
 * @notice Dynamic soul-bound NFT tracking daily on-chain activity streaks.
 *         One NFT per wallet. Colour tier based on highest historical streak.
 *         Any checkIn() call (once per UTC day) counts as daily activity.
 *
 * @dev Security audit v3:
 *   [CRIT-1] CEI pattern enforced — all state written before _mint (no reentrancy)
 *   [CRIT-2] tokenURI reverts on unminted tokenId via _requireOwned
 *   [MED-1]  approve() and setApprovalForAll() overridden to revert (soul-bound)
 *   [MED-2]  _mint used instead of _safeMint — no onERC721Received reentrancy surface
 *   [LOW-1]  Removed unused variables
 *   [LOW-2]  OZ Base64 used — battle-tested, no hand-rolled assembly
 *   [INFO-1] Removed redundant ownerOfToken mapping
 *   [v3]     Metallic on-chain SVG with per-tier gradients and readable text
 */
contract Chainstreak is ERC721, Ownable {

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct StreakData {
        uint256 tokenId;
        uint48  firstCheckIn;        // unix timestamp of first check-in (UTC day)
        uint48  lastCheckIn;         // unix timestamp of most recent check-in (UTC day)
        uint32  currentStreak;       // consecutive days active — resets on miss
        uint32  highestStreak;       // all-time peak streak — never decreases
        uint32  totalActiveDays;     // lifetime active days
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 private _nextTokenId = 1;

    /// wallet → streak data
    mapping(address => StreakData) public streakOf;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Minted(address indexed wallet, uint256 indexed tokenId, uint48 timestamp);
    event CheckedIn(
        address indexed wallet,
        uint256 indexed tokenId,
        uint32  currentStreak,
        uint32  highestStreak,
        uint32  totalActiveDays
    );
    event StreakBroken(address indexed wallet, uint256 indexed tokenId, uint32 lastStreak);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyCheckedInToday();
    error TransferNotAllowed();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() ERC721("Chainstreak", "CSTRK") Ownable(msg.sender) {}

    // ─── External: Check-In ───────────────────────────────────────────────────

    /**
     * @notice Call once per UTC day to record activity.
     *         First call mints your soul-bound NFT; subsequent calls update it.
     * @dev    Checks-Effects-Interactions strictly enforced.
     */
    function checkIn() external {
        address wallet = msg.sender;
        StreakData storage data = streakOf[wallet];

        uint48 today     = _utcDay(block.timestamp);
        uint48 yesterday = today - 1 days;

        // ── First ever check-in: mint ──────────────────────────────────────
        if (data.tokenId == 0) {
            uint256 newId = _nextTokenId++;

            // Effects first — all state written before any external call
            data.tokenId         = newId;
            data.firstCheckIn    = today;
            data.lastCheckIn     = today;
            data.currentStreak   = 1;
            data.highestStreak   = 1;
            data.totalActiveDays = 1;

            // Interaction — _mint has no external callback (unlike _safeMint)
            _mint(wallet, newId);

            emit Minted(wallet, newId, today);
            emit CheckedIn(wallet, newId, 1, 1, 1);
            return;
        }

        // ── Already checked in today ───────────────────────────────────────
        if (data.lastCheckIn == today) revert AlreadyCheckedInToday();

        // ── Consecutive day → extend streak ───────────────────────────────
        if (data.lastCheckIn == yesterday) {
            data.currentStreak += 1;
        } else {
            emit StreakBroken(wallet, data.tokenId, data.currentStreak);
            data.currentStreak = 1;
        }

        if (data.currentStreak > data.highestStreak) {
            data.highestStreak = data.currentStreak;
        }

        data.lastCheckIn     = today;
        data.totalActiveDays += 1;

        emit CheckedIn(
            wallet,
            data.tokenId,
            data.currentStreak,
            data.highestStreak,
            data.totalActiveDays
        );
    }

    // ─── View: Tier ───────────────────────────────────────────────────────────

    /**
     * @notice Tier derived from highest historical streak — never decreases.
     *         0 = White (0-9)  1 = Blue (10-49)  2 = Silver (50-99)  3 = Gold (100+)
     */
    function tierOf(address wallet) public view returns (uint8) {
        uint32 best = streakOf[wallet].highestStreak;
        if (best >= 100) return 3;
        if (best >= 50)  return 2;
        if (best >= 10)  return 1;
        return 0;
    }

    // ─── View: tokenURI — fully on-chain metallic SVG ─────────────────────────

    /**
     * @notice Returns base64-encoded JSON with embedded SVG. No IPFS dependency.
     * @dev    Reverts for unminted tokenIds via _requireOwned (ERC-721 compliant).
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address wallet = _requireOwned(tokenId);
        StreakData memory data = streakOf[wallet];
        uint8 tier = tierOf(wallet);

        string memory svg = _buildSVG(tier, data, tokenId);

        string memory json = string(abi.encodePacked(
            '{"name":"Chainstreak #', _uint2str(tokenId), '",',
            '"description":"A dynamic soul-bound on-chain streak NFT. Tier based on all-time highest streak.",',
            '"attributes":[',
              '{"trait_type":"Tier","value":"',              _tierName(tier),                   '"},',
              '{"trait_type":"Highest Streak","value":',     _uint2str(data.highestStreak),     '},',
              '{"trait_type":"Current Streak","value":',     _uint2str(data.currentStreak),     '},',
              '{"trait_type":"Total Active Days","value":',  _uint2str(data.totalActiveDays),   '}',
            '],',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,", Base64.encode(bytes(json))
        ));
    }

    // ─── Soul-bound: block all transfers and approvals ────────────────────────

    function transferFrom(address, address, uint256) public pure override {
        revert TransferNotAllowed();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert TransferNotAllowed();
    }

    function approve(address, uint256) public pure override {
        revert TransferNotAllowed();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert TransferNotAllowed();
    }

    // ─── Internal: SVG builder ────────────────────────────────────────────────

    function _buildSVG(
        uint8 tier,
        StreakData memory data,
        uint256 tokenId
    ) internal pure returns (string memory) {
        TierStyle memory s = _tierStyle(tier);

        // Split into parts to avoid stack-too-deep
        string memory part1 = _svgHeader(s);
        string memory part2 = _svgRings(s);
        string memory part3 = _svgText(s, data, tokenId);

        return string(abi.encodePacked(part1, part2, part3, '</svg>'));
    }

    struct TierStyle {
        string bg0;       // gradient top
        string bg1;       // gradient mid-upper
        string bg2;       // gradient mid-lower
        string bg3;       // gradient bottom
        string ring0;     // ring gradient top
        string ring1;     // ring gradient mid
        string ring2;     // ring gradient bottom
        string numTop;    // number gradient top
        string numBot;    // number gradient bottom
        string textMain;  // tier name + stats text
        string textSub;   // subdued labels
        string textFaint; // token id
        string tierName;
    }

    function _tierStyle(uint8 tier) internal pure returns (TierStyle memory s) {
        if (tier == 3) {
            // Gold
            s.bg0      = "#fff0a0"; s.bg1 = "#FFD700"; s.bg2 = "#d4a800"; s.bg3 = "#b8860b";
            s.ring0    = "#fffbe0"; s.ring1 = "#FFD700"; s.ring2 = "#8a6500";
            s.numTop   = "#7a4f00"; s.numBot = "#3d2500";
            s.textMain = "#3d2500"; s.textSub = "#7a5000"; s.textFaint = "#a07800";
            s.tierName = "GOLD";
        } else if (tier == 2) {
            // Silver
            s.bg0      = "#e8e8e8"; s.bg1 = "#c8c8cc"; s.bg2 = "#a8a8b0"; s.bg3 = "#989898";
            s.ring0    = "#ffffff"; s.ring1 = "#aaaaaa"; s.ring2 = "#666666";
            s.numTop   = "#ffffff"; s.numBot = "#999999";
            s.textMain = "#1a1a2e"; s.textSub = "#333344"; s.textFaint = "#666677";
            s.tierName = "SILVER";
        } else if (tier == 1) {
            // Blue
            s.bg0      = "#7ec3ff"; s.bg1 = "#4FA3FF"; s.bg2 = "#2a7de0"; s.bg3 = "#1a5fba";
            s.ring0    = "#ffffff"; s.ring1 = "#90c8ff"; s.ring2 = "#2a7de0";
            s.numTop   = "#ffffff"; s.numBot = "#d0eaff";
            s.textMain = "#ffffff"; s.textSub = "#ddf0ff"; s.textFaint = "#aad4ff";
            s.tierName = "BLUE";
        } else {
            // White / Pearl
            s.bg0      = "#ffffff"; s.bg1 = "#e8e8ec"; s.bg2 = "#d0d0d8"; s.bg3 = "#c0c0cc";
            s.ring0    = "#ffffff"; s.ring1 = "#aaaabc"; s.ring2 = "#888899";
            s.numTop   = "#333344"; s.numBot = "#555566";
            s.textMain = "#1a1a2e"; s.textSub = "#444455"; s.textFaint = "#888899";
            s.tierName = "WHITE";
        }
    }

    function _svgHeader(TierStyle memory s) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs>',
              '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">',
                '<stop offset="0%" stop-color="',   s.bg0, '"/>',
                '<stop offset="35%" stop-color="',  s.bg1, '"/>',
                '<stop offset="68%" stop-color="',  s.bg2, '"/>',
                '<stop offset="100%" stop-color="', s.bg3, '"/>',
              '</linearGradient>',
              '<linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">',
                '<stop offset="0%" stop-color="',   s.ring0, '"/>',
                '<stop offset="50%" stop-color="',  s.ring1, '"/>',
                '<stop offset="100%" stop-color="', s.ring2, '"/>',
              '</linearGradient>',
              '<linearGradient id="ng" x1="0" y1="0" x2="0" y2="1">',
                '<stop offset="0%" stop-color="',   s.numTop, '"/>',
                '<stop offset="100%" stop-color="', s.numBot, '"/>',
              '</linearGradient>',
              '<linearGradient id="sh" x1="0" y1="0" x2="1" y2="1">',
                '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>',
                '<stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>',
                '<stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>',
              '</linearGradient>',
              '<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">',
                '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>',
                '<stop offset="50%" stop-color="#ffffff" stop-opacity="0.3"/>',
                '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>',
              '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            '<ellipse cx="130" cy="95" rx="185" ry="135" fill="url(#sh)"/>',
            '<rect x="0" y="138" width="400" height="26" fill="url(#sw)"/>',
            '<line x1="0" y1="80"  x2="400" y2="80"  stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.4"/>',
            '<line x1="0" y1="158" x2="400" y2="158" stroke="#ffffff" stroke-width="0.3" stroke-opacity="0.2"/>'
        ));
    }

    function _svgRings(TierStyle memory s) internal pure returns (string memory) {
        // Suppress unused warning — s used for stroke colour derivation
        // All ring colours come from the gradient defined in header
        bytes memory unused = bytes(s.ring1);
        unused;
        return string(abi.encodePacked(
            '<circle cx="200" cy="152" r="84"  fill="none" stroke="url(#rg)" stroke-width="2.5"/>',
            '<circle cx="200" cy="152" r="64"  fill="#ffffff" fill-opacity="0.15"/>',
            '<circle cx="200" cy="152" r="96"  fill="none" stroke="#ffffff" stroke-width="0.6" stroke-opacity="0.25"/>',
            '<circle cx="200" cy="152" r="108" fill="none" stroke="#ffffff" stroke-width="0.3" stroke-opacity="0.12"/>'
        ));
    }

    function _svgText(
        TierStyle memory s,
        StreakData memory data,
        uint256 tokenId
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            // Big streak number — gradient fill
            '<text x="200" y="170" text-anchor="middle" font-family="monospace" font-size="54" font-weight="bold" fill="url(#ng)">',
              _uint2str(data.highestStreak),
            '</text>',
            // "BEST STREAK" label
            '<text x="200" y="193" text-anchor="middle" font-family="monospace" font-size="9" fill="',
              s.textSub, '" letter-spacing="3">BEST STREAK</text>',
            // Divider
            '<line x1="120" y1="226" x2="280" y2="226" stroke="', s.textSub, '" stroke-width="0.6" stroke-opacity="0.4"/>',
            // Tier name
            '<text x="200" y="257" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="',
              s.textMain, '" letter-spacing="6">', s.tierName, '</text>',
            // Stats panel background
            '<rect x="55" y="270" width="290" height="56" rx="8" fill="#00000013"/>',
            // Stats text
            '<text x="200" y="291" text-anchor="middle" font-family="monospace" font-size="10" fill="',
              s.textMain, '" letter-spacing="1">CURRENT STREAK  ', _uint2str(data.currentStreak), ' days</text>',
            '<text x="200" y="312" text-anchor="middle" font-family="monospace" font-size="10" fill="',
              s.textMain, '" letter-spacing="1">TOTAL ACTIVE  ', _uint2str(data.totalActiveDays), ' days</text>',
            // Token ID pill
            '<rect x="125" y="354" width="150" height="22" rx="11" fill="#00000016"/>',
            '<text x="200" y="369" text-anchor="middle" font-family="monospace" font-size="9" fill="',
              s.textFaint, '">CHAINSTREAK #', _uint2str(tokenId), '</text>'
        ));
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _utcDay(uint256 ts) internal pure returns (uint48) {
        return uint48((ts / 1 days) * 1 days);
    }

    function _tierName(uint8 tier) internal pure returns (string memory) {
        if (tier == 3) return "GOLD";
        if (tier == 2) return "SILVER";
        if (tier == 1) return "BLUE";
        return "WHITE";
    }

    function _uint2str(uint256 n) internal pure returns (string memory) {
        if (n == 0) return "0";
        uint256 temp = n;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buf = new bytes(digits);
        while (n != 0) { digits--; buf[digits] = bytes1(uint8(48 + n % 10)); n /= 10; }
        return string(buf);
    }
}
