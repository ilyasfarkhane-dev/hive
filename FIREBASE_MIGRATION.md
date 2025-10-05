# Migration de Cloudinary vers Firebase Storage

## Résumé de la migration

Ce projet a été migré de Cloudinary vers Firebase Storage pour le stockage des fichiers. La migration maintient la compatibilité avec les fichiers Cloudinary existants tout en utilisant Firebase pour les nouveaux uploads.

## Changements effectués

### 1. Nouveau service Firebase (`services/firebaseService.ts`)
- Remplace `services/cloudinaryService.ts` pour les nouveaux uploads
- Fournit les mêmes fonctionnalités : upload, téléchargement, suppression
- Utilise Firebase Storage SDK v9+

### 2. Routes API mises à jour
- `api/upload-documents/route.ts` : Utilise maintenant Firebase Storage
- `api/getFileUrl/route.ts` : Supporte les chemins Firebase Storage
- `api/download-file/route.ts` : Compatible avec Firebase et Cloudinary
- `api/firebase-download/route.ts` : Nouvelle route pour Firebase Storage

### 3. Utilitaires mis à jour
- `utils/fileUtils.ts` : Support pour Firebase Storage
- `utils/crmFieldMapping.ts` : Mapping CRM mis à jour pour Firebase

### 4. Configuration
- `firebase.config.js` : Configuration Firebase centralisée
- Firebase déjà installé dans `package.json`

## Fonctionnalités

### Upload de fichiers
```typescript
import { uploadToFirebase } from '@/services/firebaseService';

const result = await uploadToFirebase(file, {
  folder: 'hive-documents/user@example.com',
  metadata: {
    originalName: file.name,
    userEmail: 'user@example.com'
  }
});
```

### Téléchargement de fichiers
```typescript
import { getFirebaseDownloadURL } from '@/services/firebaseService';

const downloadURL = await getFirebaseDownloadURL('hive-documents/user@example.com/filename.pdf');
```

### Suppression de fichiers
```typescript
import { deleteFromFirebase } from '@/services/firebaseService';

await deleteFromFirebase('hive-documents/user@example.com/filename.pdf');
```

## Compatibilité

### Fichiers existants
- Les fichiers Cloudinary existants continuent de fonctionner
- Le système détecte automatiquement le type de stockage
- Redirection automatique vers les APIs appropriées

### Nouvelles fonctionnalités
- Tous les nouveaux uploads utilisent Firebase Storage
- Fallback vers stockage local si Firebase échoue
- Métadonnées enrichies pour les fichiers

## Structure des fichiers Firebase

```
hive-documents/
├── user@example.com/
│   ├── 1703123456789_document.pdf
│   └── 1703123456790_image.jpg
└── another@example.com/
    └── 1703123456791_report.docx
```

## Configuration requise

1. **Firebase Project** : `hive-42335`
2. **Storage Bucket** : `hive-42335.firebasestorage.app`
3. **Permissions** : Règles de sécurité Firebase configurées

## Règles de sécurité Firebase Storage (recommandées)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permettre l'upload et le téléchargement pour les fichiers hive-documents
    match /hive-documents/{userId}/{allPaths=**} {
      allow read, write: if true; // Ajuster selon vos besoins de sécurité
    }
  }
}
```

## Migration des données existantes

Pour migrer les fichiers Cloudinary existants vers Firebase :

1. Lister les fichiers Cloudinary existants
2. Télécharger chaque fichier depuis Cloudinary
3. Uploader vers Firebase Storage avec le même chemin
4. Mettre à jour les références dans la base de données

## Dépannage

### Erreurs courantes
- **Firebase not initialized** : Vérifier la configuration dans `firebase.config.js`
- **Permission denied** : Vérifier les règles de sécurité Firebase Storage
- **File not found** : Vérifier le chemin du fichier et les permissions

### Logs
Les logs incluent des emojis pour faciliter le débogage :
- 🔥 Firebase operations
- ☁️ Cloudinary operations (legacy)
- ✅ Succès
- ❌ Erreurs
- 🔄 Opérations en cours

## Support

Pour toute question ou problème lié à la migration Firebase, consulter :
1. Les logs de la console
2. La documentation Firebase Storage
3. Les tests d'intégration dans le projet



