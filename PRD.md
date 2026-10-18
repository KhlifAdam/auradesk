# Cahier des Charges - AuraDesk (Plateforme Web Photographie & Audiovisuel)

## 1. Informations Générales
- **Étudiant :** Khlif Adam
- **Domaine :** Génie Logiciel
- **Type de projet :** Projet de Fin d’Études (PFE)
- **Version :** Version 0 — Cahier des charges fonctionnel
- **Nom de l'application :** AuraDesk (Conception et développement d’une plateforme web intelligente de présentation et de gestion des activités photographiques et audiovisuelles).

## 2. Contexte et Problématique
Les photographes/vidéastes indépendants utilisent de multiples outils dispersés (réseaux sociaux, messageries, calendriers, fichiers locaux, logiciels de montage). Cela rend le suivi difficile. 
**Problématique :** Centraliser le cycle de vie d'une prestation (contact, devis, shooting, post-production, livraison) pour réduire les tâches répétitives.

## 3. Solution Proposée
Application web avec deux espaces complémentaires :
1. **Partie publique (Site pro) :** Portfolio, services, contact, devis/réservation.
2. **Partie privée (Espace de gestion) :** CRM (clients, devis, calendrier, projets, équipe, médias, matériel, facturation/livraison, IA, statistiques).

## 4. Acteurs du Système
- **Administrateur :** Gère la plateforme globale, les comptes (SaaS ready). Ne voit pas les données privées des photographes.
- **Photographe / Vidéaste :** Acteur principal. Gère son site, ses clients, projets, médias, équipe.
- **Client :** Visiteur du site, demande de devis, suivi de projet, sélection de photos, réception des livrables.
- **Équipe (Collaborateurs) :** Invités par le photographe pour des tâches spécifiques avec des accès limités (ex: monteur, pilote drone).

## 5. Fonctionnalités Clés
- **Authentification & Sécurité :** RBAC (Role-Based Access Control), séparation stricte des données (multi-tenant/SaaS architecture).
- **Site Public :** Portfolio catégorisé, packages, formulaire de booking.
- **Gestion Commerciale :** Demandes, devis personnalisés, facturation.
- **Planification :** Calendrier (conflits, réunions, shootings).
- **Gestion de Projets (Workflow) :** Booking -> Prep -> Shooting -> Import -> Orga -> Selection -> Post-Prod -> Export -> Validation -> Delivery.
- **Gestion des Médias :** Organisation chronologique/sources, renommage automatique.
- **Gestion du Matériel & Locations :** Inventaire, statut, dates de location.
- **Livraison Client :** Galeries privées sécurisées, sélection/commentaires par le client.
- **Statistiques :** Revenus, temps de production, services populaires.

## 6. Fonctionnalités d'Intelligence Artificielle (IA)
- **AI Photo Assistant :** Détection de flou/yeux fermés, regroupement des quasi-duplicatas, analyse d'exposition.
- **AI Video Assistant :** Détection de scènes, catégorisation, durée/silences.
- **AI Photographer Assistant :** Assistant proactif (rappel de tâches, matériel à préparer pour le prochain shooting).

## 7. Architecture Technique Attendue
- Application web (Frontend + Backend).
- Base de données isolant les informations par photographe.
- Scalable vers un modèle SaaS multi-tenant.
- Stockage sécurisé des médias.

