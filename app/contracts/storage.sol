// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MicroDons {

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


    mapping(uint256 => Projet) public projets;


    address public administrator;
    uint256 private _compteurId;
    uint256[] private _tousLesIds;

    event ProjetCree(uint256 indexed id, address indexed porteur, string titre);


    constructor() {
        administrator = msg.sender;
    }

    modifier seulAdministrateur() {
        require(msg.sender == administrator, "Acces refuse");
        _;
    }

    function creerProjet(
        string calldata _titre,
        string calldata _description,
        uint256 _objectif
    ) external returns (uint256) {

        require(bytes(_titre).length > 0, "Titre obligatoire");
        require(_objectif > 0, "Objectif doit etre > 0");

        _compteurId++;
        uint256 newId = _compteurId;


        projets[newId] = Projet({
            id:                  newId,
            porteur:             payable(msg.sender),
            titre:               _titre,
            description:         _description,
            objectifFinancement: _objectif,
            montantCollecte:     0,
            actif:               true,
            fondsRetires:        false
        });

        _tousLesIds.push(newId);
        emit ProjetCree(newId, msg.sender, _titre);
        return newId;
    }
    
    function getDetails(uint256 id) external view returns (
        string memory  ,
        string memory ,
        address payable  ,
        uint256 ,
        uint256 ,
        uint256 ,
        bool ,
        bool )
        { require(id > 0 && id <= _compteurId, "Projet inexistant");
        Projet storage projet = projets[id];
        return (projet.titre, projet.description, projet.porteur , projet.objectifFinancement, projet.montantCollecte, projet.deadline, projet.actif, projet.fondsRetires);
        }

    function getContributors(uint256 id) external view returns (address payable[] memory) {
        require(id > 0 && id <= _compteurId, "Projet inexistant");
        return contributors[id];
        }
        
    function getStatut(uint256 id) external view returns (string memory) {
        require(id > 0 && id <= _compteurId, "Projet inexistant");
        Projet storage projet = projets[id];
        if (projet.actif) {
            if (projet.montantCollecte >= projet.objectifFinancement) {
                return unicode"Financé";
            } else if (projet.deadline <= block.timestamp) {
                return unicode"Expiré";
            } else {
                return "En cours";
            }
        } else {
            return unicode"Terminé";
        }
    }     
}