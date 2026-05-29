# Enact.js — LLM Context File
> Enact est un framework JavaScript basé sur React, développé par LG Electronics, ciblant principalement les **Smart TV webOS** (expérience 10 pieds — navigation à la télécommande, pas à la souris).
> Ce fichier contient les bonnes pratiques, composants Sandstone et le module Spotlight pour assister un LLM dans le développement d'apps Enact.

- Documentation officielle : https://enactjs.com/docs/
- Composants Sandstone (Smart TV) : https://enactjs.com/docs/modules/sandstone/ActionGuide/
- Spotlight (navigation) : https://enactjs.com/docs/developer-guide/spotlight/
- GitHub Sandstone : https://github.com/enactjs/sandstone
- Sampler interactif : https://enactjs.com/sampler

---

## 1. Concepts fondamentaux

### Architecture générale
Enact est construit sur React. Toute app Enact est une app React valide. Enact ajoute :
- `kind()` : factory de composants présentationnels (sucre syntaxique sur les SFC React)
- HOCs (`hoc()`) : Higher-Order Components configurables pour les comportements réutilisables
- `@enact/sandstone` : bibliothèque de composants visuels pour Smart TV
- `@enact/spotlight` : gestion du focus clavier / télécommande (5-way navigation)
- `@enact/webos` : accès aux APIs webOS (services Luna)
- `@enact/i18n` : internationalisation
- `@enact/ui` : composants de base non-stylisés

### Démarrage d'un projet
```bash
npm install -g @enact/cli
enact create my-app
cd my-app
npm start      # mode développement
npm run pack   # build production
npm run deploy # déploiement webOS
```

---

## 2. kind() — Créer des composants à la façon Enact

`kind()` est la méthode recommandée pour créer des composants présentationnels. Elle retourne un composant React standard.

### Structure complète de kind()
```js
import kind from '@enact/core/kind';
import css from './MyComponent.module.less';

const MyComponent = kind({
  // Nom du composant (utile pour le debug, React DevTools, tests)
  name: 'MyComponent',

  // Déclaration des props avec valeurs par défaut
  propTypes: {
    title: PropTypes.string,
    active: PropTypes.bool,
    onClick: PropTypes.func
  },

  defaultProps: {
    active: false
  },

  // Styles CSS Modules (joint automatiquement className entrant)
  styles: {
    css,
    className: 'myComponent',         // classe CSS de base
    publicClassNames: ['myComponent', 'title'] // classes surchargeables de l'extérieur
  },

  // Props calculées (computed) avant le render — pures, sans side-effects
  computed: {
    // Reçoit tous les props résolus, retourne la valeur calculée
    ariaLabel: ({title, active}) => `${title} ${active ? 'actif' : 'inactif'}`,
    rootClass: ({active, styler}) => styler.append({active}) // fusion CSS conditionnelle
  },

  // Fonction de rendu — reçoit les props + computed
  render: ({title, active, ariaLabel, rootClass, ...rest}) => (
    <div {...rest} className={rootClass} aria-label={ariaLabel}>
      <span>{title}</span>
    </div>
  )
});

export default MyComponent;
```

### Avantages de kind() vs SFC React classique
- `computed` : props calculées déclarativement, séparées du render, sans `useMemo`
- `styles` : fusion automatique de `className` entrant + classes internes
- `styler.append()` : gestion propre des classes CSS conditionnelles
- `name` : composant identifiable dans React DevTools et les tests
- Pas besoin de `useCallback`, `useMemo` pour les computed props statiques

### Limites de kind()
- Pas d'accès aux lifecycle methods React (`componentDidMount`, etc.)
- Pas de hooks React directs dans `render` (utiliser un wrapper `React.Component` ou HOC)
- Léger overhead au démarrage (traitement de la config)

### Quand utiliser React.Component à la place
- Quand on a besoin de lifecycle methods
- Quand on gère de l'état local complexe avec hooks
- Solution : créer une version `Base` avec `kind()` et l'envelopper dans un composant stateful

```js
// Composant Base (presentationnel, kind)
const MyComponentBase = kind({ name: 'MyComponentBase', render: ... });

// Composant stateful (classe ou hooks)
class MyComponent extends React.Component {
  state = { value: 0 };
  render() {
    return <MyComponentBase {...this.props} value={this.state.value} />;
  }
}
```

---

## 3. HOCs — Higher-Order Components

### hoc() factory
```js
import hoc from '@enact/core/hoc';

// HOC configurable
const MyHOC = hoc((config, Wrapped) => {
  const defaultConfig = { animate: true };
  const { animate } = { ...defaultConfig, ...config };

  return function MyHOCWrapper(props) {
    return <Wrapped {...props} animate={animate} />;
  };
});

// Usage
const AnimatedButton = MyHOC(Button);                    // config par défaut
const StaticButton = MyHOC({ animate: false }, Button);  // config custom
```

### HOCs Sandstone importants
- `ThemeDecorator` : décorateur racine obligatoire (inclut Spotlight + i18n + resolution)
- `Skinnable` : support des skins (dark/light/neutral)
- `TooltipDecorator` : ajoute une infobulle à n'importe quel composant
- `ContextualPopupDecorator` : ajoute un popup contextuel
- `ContextualMenuDecorator` : ajoute un menu contextuel
- `Marquee.MarqueeDecorator` : texte défilant automatiquement sur focus

---

## 4. Composants Sandstone — Référence complète

Tous les imports : `import ComponentName from '@enact/sandstone/ComponentName';`

### Mise en page & Navigation

#### ThemeDecorator ⭐ (obligatoire)
Décorateur racine qui inclut automatiquement : SpotlightRootDecorator, I18nDecorator, resolution.
```js
import ThemeDecorator from '@enact/sandstone/ThemeDecorator';
const App = ThemeDecorator(MyApp);
export default App;
// Options :
const App = ThemeDecorator({ skin: 'dark' }, MyApp); // skin: 'dark' | 'light' | 'neutral'
```

#### Panels — Navigation entre vues
Structure principale de l'app. Gère la navigation arrière automatiquement.
```js
import { Panel, Header, Panels } from '@enact/sandstone/Panels';

const MyApp = () => (
  <Panels index={panelIndex} onBack={handleBack}>
    <Panel>
      <Header title="Accueil" subtitle="Sous-titre" />
      {/* contenu du panel */}
    </Panel>
    <Panel>
      <Header title="Détail" back />
      {/* contenu */}
    </Panel>
  </Panels>
);
// Props Panels: index (actif), onBack, noAnimation
// Props Panel: autoFocus ('default-element' | 'last-focused' | 'none')
// Props Header: title, subtitle, titleBelow, back, type ('standard' | 'compact' | 'wizard')
```

#### TabLayout — Navigation par onglets
```js
import TabLayout, { Tab } from '@enact/sandstone/TabLayout';

<TabLayout>
  <Tab title="Accueil" icon="home">
    {/* contenu */}
  </Tab>
  <Tab title="Réglages" icon="setting">
    {/* contenu */}
  </Tab>
</TabLayout>
// Props TabLayout: orientation ('vertical' | 'horizontal'), collapsed
```

#### WizardPanels — Flux étape par étape
```js
import WizardPanels, { Panel } from '@enact/sandstone/WizardPanels';

<WizardPanels onComplete={handleComplete}>
  <Panel title="Étape 1" subtitle="Description">
    {/* contenu */}
    <footer><Button>Suivant</Button></footer>
  </Panel>
</WizardPanels>
```

#### FixedPopupPanels / FlexiblePopupPanels — Panels en popup
```js
import FixedPopupPanels, { Panel, Header } from '@enact/sandstone/FixedPopupPanels';

<FixedPopupPanels open={isOpen} onClose={handleClose} position="right">
  <Panel>
    <Header title="Options" />
    {/* contenu */}
  </Panel>
</FixedPopupPanels>
// position: 'right' | 'left' | 'full'
```

#### PopupTabLayout — Tabs dans un popup
```js
import PopupTabLayout, { Tab } from '@enact/sandstone/PopupTabLayout';

<PopupTabLayout open={isOpen} onClose={handleClose}>
  <Tab title="Vidéo"><BodyText>Options vidéo</BodyText></Tab>
  <Tab title="Audio"><BodyText>Options audio</BodyText></Tab>
</PopupTabLayout>
```

#### PageViews — Vues paginées
```js
import PageViews from '@enact/sandstone/PageViews';
<PageViews>{/* pages */}</PageViews>
```

#### QuickGuidePanels — Guide rapide
```js
import QuickGuidePanels, { Panel } from '@enact/sandstone/QuickGuidePanels';
```

---

### Boutons & Actions

#### Button ⭐
```js
import Button from '@enact/sandstone/Button';

<Button onClick={handleClick}>Label</Button>
<Button icon="home" />                          // icône seule
<Button icon="home" iconPosition="before">Label</Button>
<Button size="small">Petit</Button>             // size: 'small' | 'large'
<Button color="red">Coloré</Button>             // color: 'red' | 'green' | 'yellow' | 'blue'
<Button selected>Sélectionné</Button>
<Button disabled>Désactivé</Button>
<Button backgroundOpacity="transparent">Ghost</Button>
// backgroundOpacity: 'translucent' | 'lightTranslucent' | 'transparent'
```

#### ProgressButton — Bouton avec progression
```js
import ProgressButton from '@enact/sandstone/ProgressButton';
<ProgressButton progress={0.5} progressColor="green">En cours</ProgressButton>
```

#### ActionGuide — Guide d'actions (touches télécommande)
```js
import ActionGuide from '@enact/sandstone/ActionGuide';
<ActionGuide icon="arrowlargedown">Défiler vers le bas</ActionGuide>
```

#### KeyGuide — Guide des touches
```js
import KeyGuide from '@enact/sandstone/KeyGuide';
```

---

### Formulaires & Saisie

#### Input — Champ texte
```js
import Input from '@enact/sandstone/Input';

<Input placeholder="Saisir..." value={value} onChange={handleChange} />
<Input type="password" />
<Input type="number" />
<Input size="small" />    // size: 'small' | 'large'
<Input disabled />
// Ouvre automatiquement un clavier virtuel en 5-way sur webOS
```

#### Checkbox / CheckboxItem
```js
import Checkbox from '@enact/sandstone/Checkbox';
import CheckboxItem from '@enact/sandstone/CheckboxItem';

<Checkbox selected={isChecked} onToggle={handleToggle} />
<CheckboxItem selected={isChecked} onToggle={handleToggle}>
  Option activée
</CheckboxItem>
<CheckboxItem indeterminate>Partiel</CheckboxItem>
```

#### FormCheckboxItem — Checkbox style formulaire
```js
import FormCheckboxItem from '@enact/sandstone/FormCheckboxItem';
<FormCheckboxItem selected>Option de formulaire</FormCheckboxItem>
```

#### RadioItem — Bouton radio
```js
import RadioItem from '@enact/sandstone/RadioItem';
<RadioItem selected={selected === 'a'} onToggle={() => setSelected('a')}>Option A</RadioItem>
<RadioItem selected={selected === 'b'} onToggle={() => setSelected('b')}>Option B</RadioItem>
```

#### Switch / SwitchItem — Interrupteur
```js
import Switch from '@enact/sandstone/Switch';
import SwitchItem from '@enact/sandstone/SwitchItem';

<Switch selected={isOn} onToggle={handleToggle} />
<SwitchItem selected={isOn} onToggle={handleToggle}>Activer</SwitchItem>
```

#### Slider — Curseur de valeur
```js
import Slider from '@enact/sandstone/Slider';

<Slider value={volume} min={0} max={100} onChange={handleChange} />
<Slider orientation="vertical" />
<Slider step={5} />
<Slider tooltip />       // affiche la valeur au survol
<Slider disabled />
// Navigable avec 5-way : LEFT/RIGHT change la valeur
```

#### Picker — Sélecteur cyclique
```js
import Picker from '@enact/sandstone/Picker';

<Picker onChange={handleChange} value={index} width="medium">
  {['Option 1', 'Option 2', 'Option 3']}
</Picker>
// width: 'small' | 'medium' | 'large' | 'full'
// orientation: 'horizontal' | 'vertical'
```

#### RangePicker — Sélecteur de plage numérique
```js
import RangePicker from '@enact/sandstone/RangePicker';
<RangePicker min={0} max={100} value={50} onChange={handleChange} />
```

#### DatePicker / TimePicker / DayPicker
```js
import DatePicker from '@enact/sandstone/DatePicker';
import TimePicker from '@enact/sandstone/TimePicker';
import DayPicker from '@enact/sandstone/DayPicker';

<DatePicker value={date} onChange={handleDateChange} />
<TimePicker value={time} onChange={handleTimeChange} />
<DayPicker value={days} onChange={handleDaysChange} />
// value pour DatePicker/TimePicker : objet Date JS
```

#### ColorPicker — Sélecteur de couleur
```js
import ColorPicker from '@enact/sandstone/ColorPicker';
<ColorPicker value="#ff0000" onChange={handleColorChange} />
```

#### Dropdown — Liste déroulante
```js
import Dropdown from '@enact/sandstone/Dropdown';

<Dropdown
  title="Choisir une option"
  selected={selectedIndex}
  onSelect={handleSelect}
>
  {['Option A', 'Option B', 'Option C']}
</Dropdown>
// width: 'tiny' | 'small' | 'medium' | 'large' | 'x-large' | 'huge'
```

---

### Listes & Contenus

#### VirtualList ⭐ — Liste virtualisée (performances)
Composant clé pour les longues listes. Ne rend que les items visibles.
```js
import { VirtualList, VirtualGridList } from '@enact/sandstone/VirtualList';
import ri from '@enact/ui/resolution';

// IMPORTANT: ne JAMAIS utiliser une inline function pour itemRenderer
// Définir la fonction en dehors du render
const renderItem = ({ index, ...rest }) => {
  // OBLIGATOIRE: passer {...rest} pour que Spotlight fonctionne
  return (
    <Item {...rest} data-index={index}>  {/* data-index requis pour 5-way */}
      {items[index].label}
    </Item>
  );
};

// Liste verticale
<VirtualList
  dataSize={items.length}          // REQUIS
  itemRenderer={renderItem}        // REQUIS — pas d'inline function
  itemSize={ri.scale(144)}         // REQUIS — toujours utiliser ri.scale()
  spacing={ri.scale(20)}
/>

// Grille
<VirtualGridList
  dataSize={items.length}
  itemRenderer={renderItem}
  itemSize={{ minWidth: ri.scale(180), minHeight: ri.scale(270) }} // REQUIS
/>

// Scroll programmatique
const scrollTo = useRef(null);
<VirtualList
  cbScrollTo={(fn) => { scrollTo.current = fn; }}
  ...
/>
// Utilisation:
scrollTo.current({ index: 10, animate: true });
scrollTo.current({ position: { y: 0 } }); // retour en haut
```

**Règles critiques VirtualList :**
- `itemRenderer` : jamais de fonction inline (crée une nouvelle référence à chaque render)
- Toujours passer `{...rest}` au composant item (requis pour Spotlight)
- Toujours inclure `data-index` sur le composant racine de l'item
- Utiliser `ri.scale()` pour toutes les valeurs numériques de taille
- `dataSize` est la seule source de vérité sur le nombre d'items (pas `data.length`)
- Modifier `data` seul ne force pas le re-render — changer `dataSize` si besoin

#### Scroller — Conteneur scrollable
```js
import Scroller from '@enact/sandstone/Scroller';

<Scroller direction="vertical">   {/* 'vertical' | 'horizontal' | 'both' */}
  {/* contenu long */}
</Scroller>
// Toujours définir width et height du Scroller via CSS
// cbScrollTo disponible pour scroll programmatique (même API que VirtualList)
```

#### Item — Élément de liste standard
```js
import Item from '@enact/sandstone/Item';
<Item onClick={handleClick}>Élément de liste</Item>
<Item label="Sous-label">Titre principal</Item>
<Item slotBefore={<Icon>star</Icon>}>Avec icône gauche</Item>
<Item slotAfter={<Icon>arrowright</Icon>}>Avec icône droite</Item>
```

#### IconItem — Item avec grande icône
```js
import IconItem from '@enact/sandstone/IconItem';
<IconItem icon="home" label="Sous-texte">Titre</IconItem>
```

#### ImageItem — Item avec image (grille)
```js
import ImageItem from '@enact/sandstone/ImageItem';
<ImageItem
  source="https://example.com/image.jpg"
  caption="Titre"
  subCaption="Sous-titre"
  selectionOverlayShowing={isSelected}  // overlay de sélection
>
  {/* contenu optionnel */}
</ImageItem>
```

---

### Popups & Superpositions

#### Popup — Fenêtre modale
```js
import Popup from '@enact/sandstone/Popup';

<Popup
  open={isOpen}
  onClose={handleClose}
  title="Titre"
>
  <p>Contenu du popup</p>
  <buttons>
    <Button onClick={handleClose}>Annuler</Button>
    <Button onClick={handleConfirm}>Confirmer</Button>
  </buttons>
</Popup>
// position: 'bottom' | 'center' | 'fullscreen' | 'left' | 'right' | 'top'
// Spotlight piégé dans le popup automatiquement (spotlightRestrict='self-only')
```

#### Alert — Dialogue d'alerte
```js
import Alert from '@enact/sandstone/Alert';
<Alert open={isOpen} onClose={handleClose} title="Attention" type="overlay">
  <p>Message d'alerte</p>
  <buttons>
    <Button>OK</Button>
  </buttons>
</Alert>
// type: 'fullscreen' | 'overlay'
```

#### ContextualPopupDecorator — Popup ancré sur un composant
```js
import ContextualPopupDecorator from '@enact/sandstone/ContextualPopupDecorator';

const ButtonWithPopup = ContextualPopupDecorator(Button);
const MyPopup = () => <div>Contenu popup</div>;

<ButtonWithPopup
  popupComponent={MyPopup}
  open={isOpen}
  onOpen={handleOpen}
  onClose={handleClose}
  direction="below left"  // position relative au composant
>
  Ouvrir popup
</ButtonWithPopup>
// direction: 'above' | 'above center' | 'above left' | 'above right'
//           'below' | 'below center' | 'below left' | 'below right'
//           'left middle' | 'right middle'
```

#### ContextualMenuDecorator — Menu contextuel
```js
import ContextualMenuDecorator from '@enact/sandstone/ContextualMenuDecorator';
const ButtonWithMenu = ContextualMenuDecorator(Button);

<ButtonWithMenu
  popupComponent={MenuContent}
  direction="below center"
>Menu</ButtonWithMenu>
```

---

### Texte & Affichage

#### BodyText — Texte de contenu
```js
import BodyText from '@enact/sandstone/BodyText';
<BodyText>Texte de contenu</BodyText>
<BodyText centered>Texte centré</BodyText>
<BodyText noWrap>Texte sans retour à la ligne</BodyText>
```

#### Heading — Titre de section
```js
import Heading from '@enact/sandstone/Heading';
<Heading>Titre de section</Heading>
<Heading size="title">Grand titre</Heading>    // size: 'title' | 'subtitle' | 'large' | 'medium' | 'small' | 'tiny'
<Heading showLine>Avec ligne de séparation</Heading>
<Heading spacing="auto">Espacement auto</Heading>
```

#### Marquee — Texte défilant
```js
import Marquee from '@enact/sandstone/Marquee';
// Démarre automatiquement quand le composant a le focus
<Marquee>Ce texte très long va défiler automatiquement quand focusé</Marquee>
<Marquee marqueeOn="render">Défile dès le rendu</Marquee>
// marqueeOn: 'focus' (défaut) | 'hover' | 'render'
<Marquee disabled>Pas de défilement</Marquee>

// MarqueeDecorator : ajouter le comportement à un composant custom
import { MarqueeDecorator } from '@enact/sandstone/Marquee';
const MarqueeText = MarqueeDecorator('div');
```

#### Icon — Icône
```js
import Icon from '@enact/sandstone/Icon';
<Icon>home</Icon>
<Icon size="small">setting</Icon>   // size: 'small' | 'medium' | 'large' | 'huge'
<Icon>http://example.com/icon.svg</Icon>  // URL externe
// Icônes disponibles: home, setting, search, play, pause, stop, back, forward,
// arrowup, arrowdown, arrowleft, arrowright, star, heart, check, plus, minus,
// edit, delete, refresh, info, warning, sound, picture, list, grid, etc.
```

#### Image — Image
```js
import Image from '@enact/sandstone/Image';
<Image src="https://example.com/image.jpg" alt="Description" />
<Image src={{hd: 'hd.jpg', fhd: 'fhd.jpg', uhd: 'uhd.jpg'}} />  // résolutions multiples
// Utiliser pour les images responsives sur différentes résolutions TV
```

---

### Feedback & États

#### Spinner — Indicateur de chargement
```js
import Spinner from '@enact/sandstone/Spinner';
<Spinner />
<Spinner centered />     // centré dans son conteneur
<Spinner blockClickOn="container">Chargement...</Spinner>
// blockClickOn: 'container' | 'screen' — bloque les clics pendant le chargement
```

#### ProgressBar — Barre de progression
```js
import ProgressBar from '@enact/sandstone/ProgressBar';
<ProgressBar progress={0.5} />                      // 0 à 1
<ProgressBar progress={0.7} backgroundProgress={0.9} />  // avec buffer
<ProgressBar orientation="vertical" />
<ProgressBar highlighted />    // style mis en valeur
```

#### Steps — Indicateur d'étapes
```js
import Steps from '@enact/sandstone/Steps';
<Steps current={2} total={5} />
```

#### Sprite — Animation sprite
```js
import Sprite from '@enact/sandstone/Sprite';
<Sprite src="sprite.png" columns={10} rows={2} duration={1000} />
```

---

### Décorators & Utilitaires

#### TooltipDecorator — Infobulle
```js
import TooltipDecorator from '@enact/sandstone/TooltipDecorator';
const ButtonWithTooltip = TooltipDecorator(Button);

<ButtonWithTooltip tooltipText="Description de l'action" tooltipPosition="above">
  Bouton
</ButtonWithTooltip>
// tooltipPosition: 'above' | 'above center' | 'above left' | 'below' | etc.
// tooltipDelay: délai en ms avant affichage (défaut: 500)
```

#### Skinnable — Support des skins
```js
import Skinnable from '@enact/sandstone/Skinnable';
const ThemedComponent = Skinnable(MyComponent);
<ThemedComponent skin="dark" />   // skin: 'dark' | 'light' | 'neutral' | 'highContrast'
```

#### Region — Région d'accessibilité ARIA
```js
import Region from '@enact/sandstone/Region';
<Region title="Zone de navigation principale">
  {/* contenu */}
</Region>
```

---

### Média

#### VideoPlayer — Lecteur vidéo complet
```js
import VideoPlayer from '@enact/sandstone/VideoPlayer';

<VideoPlayer
  title="Titre de la vidéo"
  infoComponents="Auteur · Durée"
  onEnded={handleEnded}
>
  <source src="video.mp4" type="video/mp4" />
</VideoPlayer>
// Contrôles 5-way intégrés: play/pause, seek, volume
// Props: autoCloseTimeout, titleHideDelay, jumpBy (secondes)
```

#### MediaPlayer — Lecteur audio/vidéo simplifié
```js
import MediaPlayer from '@enact/sandstone/MediaPlayer';
<MediaPlayer title="Titre" artist="Artiste" source="audio.mp3" />
```

#### MediaOverlay — Superposition sur média
```js
import MediaOverlay from '@enact/sandstone/MediaOverlay';
<MediaOverlay title="Titre" progress={0.5} source="image.jpg">
  <Icon>play</Icon>
</MediaOverlay>
```

---

## 5. Spotlight — Navigation 5-way

### Qu'est-ce que Spotlight ?
Spotlight est le système de gestion du focus clavier/télécommande d'Enact. Il intercepte les touches **UP, DOWN, LEFT, RIGHT, ENTER** et déplace le focus entre les composants "spottables" selon un algorithme spatial (basé sur les coordonnées réelles à l'écran).

Spotlight opère en deux modes :
- **5-way mode** : navigation clavier/télécommande (mode par défaut)
- **Pointer mode** : navigation souris (activé sur `mousemove`, revient en 5-way sur `keydown`)

**Important :** Sur webOS, le mode initial est déterminé par le mode pointeur courant de la plateforme.

### SpotlightRootDecorator — Initialisation
Requis une seule fois à la racine. **Inclus automatiquement dans ThemeDecorator** — ne pas ajouter en double si ThemeDecorator est utilisé.
```js
// Usage standalone (sans Sandstone)
import SpotlightRootDecorator from '@enact/spotlight/SpotlightRootDecorator';
const App = SpotlightRootDecorator(AppView);

// Avec Sandstone — ThemeDecorator suffit (SpotlightRootDecorator inclus)
import ThemeDecorator from '@enact/sandstone/ThemeDecorator';
const App = ThemeDecorator(AppView); // ✅ Spotlight déjà configuré
```

### Spottable — Rendre un composant focusable
```js
import Spottable from '@enact/spotlight/Spottable';

// Rendre un div focusable
const SpottableDiv = Spottable('div');

// Rendre un composant custom focusable
const SpottableMyComponent = Spottable(MyComponent);

// Configuration
const NoMouseEmulate = Spottable({ emulateMouse: false }, 'div');
// emulateMouse: true (défaut) — simule onClick sur ENTER
// emulateMouse: false — ENTER ne déclenche pas onClick

// Désactiver temporairement
<SpottableDiv spotlightDisabled={isLoading} />
```

**Note :** Les composants Sandstone (Button, Item, CheckboxItem, etc.) sont déjà Spottable par défaut.

### SpotlightContainerDecorator — Grouper les composants
Les containers organisent les composants spottables en groupes de navigation logiques.
```js
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

// Container simple
const NavContainer = SpotlightContainerDecorator('div');

// Container configuré
const MenuContainer = SpotlightContainerDecorator({
  // Quel élément reçoit le focus en premier quand on entre dans le container
  enterTo: 'last-focused',        // 'last-focused' | 'default-element' | null (par défaut)
  // null : premier spottable, 'last-focused' : mémorise, 'default-element' : cherche .spottable-default

  // Sélecteur pour l'élément par défaut (utilisé si enterTo: 'default-element')
  defaultElement: '.spottable-default',

  // Contrôle la sortie du focus hors du container
  leaveFor: {
    left: '',           // '' = bloquer cette direction (ne pas sortir)
    right: '',          // utile pour piéger le focus dans un menu
    up: '#header',      // selector CSS : envoyer le focus à cet élément
    down: null          // null = comportement 5-way par défaut
  },

  // Restriction du focus
  restrict: 'none',     // 'none' (défaut) | 'self-first' | 'self-only'
  // 'self-first' : priorité aux spottables du container, sinon sort
  // 'self-only'  : focus ne peut pas sortir du container (utile pour les modales)

  // Conserver l'ID du container au unmount
  preserveId: false
}, 'div');

// Usage
<MenuContainer containerId="main-menu" spotlightDisabled={menuClosed}>
  <Button>Item 1</Button>
  <Button className="spottable-default">Item 2 (défaut)</Button>
  <Button>Item 3</Button>
</MenuContainer>
```

### API Spotlight programmatique
```js
import Spotlight from '@enact/spotlight';

// Focus sur un container ou sélecteur
Spotlight.focus('containerId');
Spotlight.focus('@containerId');                        // syntaxe @
Spotlight.focus('[data-component-id="myButton"]');      // sélecteur CSS querySelector
Spotlight.focus('[data-container-id="menu"] .spottable'); // force le re-indexing

// IMPORTANT: pour les containers avec DOM dynamique, utiliser un selector CSS
// plutôt que l'ID du container — force Spotlight à re-indexer les spottables
// ❌ Mauvais (peut rater les nouveaux éléments):
Spotlight.focus('my-container');
// ✅ Bon (force re-indexing):
Spotlight.focus('[data-container-id="my-container"] .spottable');

// Déplacer le focus dans une direction
Spotlight.move('left');    // 'left' | 'right' | 'up' | 'down'
Spotlight.move('down', '[data-container-id="list"]'); // dans un container spécifique

// Pause/Resume (utile pour les transitions d'animation)
Spotlight.pause();
// ... animation ...
Spotlight.resume();

// État du focus
Spotlight.getCurrent();       // élément DOM actuellement focusé
Spotlight.isPaused();         // boolean
Spotlight.isSpottable(node);  // boolean
```

### Propriétés Spotlight sur les composants
```js
// Désactiver temporairement le focus
<Button spotlightDisabled={isLoading} />
<MenuContainer spotlightDisabled={!isMenuOpen} />

// Overrider la navigation 5-way
<Button
  onSpotlightDown={(e) => {
    e.preventDefault();   // empêche le comportement par défaut
    e.stopPropagation();
    Spotlight.focus('[data-component-id="target"]');
  }}
  onSpotlightUp={handleUp}
  onSpotlightLeft={handleLeft}
  onSpotlightRight={handleRight}
/>

// ID pour ciblage programmatique
<Button data-component-id="my-button" />
```

### Patterns Spotlight courants

#### Piéger le focus dans une modale
```js
// Pattern standard pour popup/modal
const ModalContainer = SpotlightContainerDecorator({
  enterTo: 'default-element',
  restrict: 'self-only'   // focus ne peut pas sortir
}, 'div');

// Dans le composant
const Modal = ({ open }) => (
  <ModalContainer spotlightDisabled={!open}>
    <Button className="spottable-default">Action principale</Button>
    <Button>Annuler</Button>
  </ModalContainer>
);
```

#### Menu mémorisant la position
```js
const SideMenu = SpotlightContainerDecorator({
  enterTo: 'last-focused',  // mémorise le dernier item focusé
  leaveFor: { right: '#main-content' }  // quitter vers le contenu principal
}, 'nav');
```

#### Focus initial au chargement d'un Panel
```js
// Dans les Panels Sandstone, utiliser autoFocus sur le Panel
<Panel autoFocus="default-element">
  <Button className="spottable-default">Premier focus</Button>
</Panel>

// Ou programmatiquement après rendu
useEffect(() => {
  Spotlight.focus('[data-container-id="my-panel"] .spottable-default');
}, []);
```

#### Gestion des listes avec VirtualList
```js
// data-index OBLIGATOIRE sur l'item racine pour la navigation 5-way
const renderItem = ({ index, ...rest }) => (
  <Item {...rest} data-index={index}>  {/* {...rest} inclut data-index automatiquement */}
    {items[index].label}
  </Item>
);
// Note: VirtualList passe data-index dans rest, donc {...rest} seul suffit
```

---

## 6. Performance — Bonnes pratiques

### Resolution Independence (ri)
Toujours utiliser `ri.scale()` pour les valeurs de taille afin d'adapter automatiquement aux résolutions HD/FHD/UHD.
```js
import ri from '@enact/ui/resolution';

// ❌ Valeur fixe
<VirtualList itemSize={144} />

// ✅ Valeur adaptée à la résolution
<VirtualList itemSize={ri.scale(144)} />

// Dans les styles Less/CSS : utiliser les mixins Enact
// .myClass { height: ri.scale(300px); }
```

### Job — Throttle/Debounce performant
```js
import { Job } from '@enact/core/util';

// Throttle : execute au maximum toutes les N ms
const throttledUpdate = new Job((value) => {
  setState({ value });
}, 100);

// Debounce : execute seulement après N ms sans appel
const debouncedSearch = new Job((query) => {
  performSearch(query);
}, 300);

// Usage
const handleWheel = (e) => throttledUpdate.throttle(e.deltaY);
const handleInput = (e) => debouncedSearch.start(e.value);

// requestIdleCallback (si supporté par le navigateur)
const idleJob = new Job(() => { /* tâche non critique */ });
idleJob.idle();  // execute pendant les périodes d'inactivité
```

### Eviter les re-renders inutiles
```js
// ❌ Inline function dans VirtualList
<VirtualList itemRenderer={({ index }) => <Item>{items[index]}</Item>} />

// ✅ Fonction définie hors du render
const renderItem = ({ index, ...rest }) => <Item {...rest}>{items[index]}</Item>;
<VirtualList itemRenderer={renderItem} />

// ❌ Objet inline (nouvelle référence à chaque render)
<MyComponent style={{ color: 'red' }} />

// ✅ Objet mémorisé
const style = { color: 'red' }; // hors du composant
// ou useMemo pour les objets dynamiques
const style = useMemo(() => ({ color: activeColor }), [activeColor]);
```

### shouldComponentUpdate / PureComponent
```js
// Pour les items de VirtualList, utiliser PureComponent ou React.memo
const ListItem = React.memo(({ label, selected }) => (
  <Item selected={selected}>{label}</Item>
));
```

### Ne pas muter l'état
```js
// ❌ Mutation directe
this.state.items.push(newItem);
this.setState({ items: this.state.items });

// ✅ Nouvel objet
this.setState({ items: [...this.state.items, newItem] });
```

---

## 7. webOS — APIs natives

### Modules @enact/webos disponibles

```js
// Détecter la plateforme
import platform from '@enact/webos/platform';
if (platform.tv) { /* Smart TV */ }
if (platform.tv && platform.platformVersion >= 6) { /* webOS 6+ */ }
// platform.tv, platform.watch, platform.signage, platform.open (Open webOS)

// Infos sur l'application
import application from '@enact/webos/application';
const { appId, appPath } = application;

// Logging webOS (pmloglib)
import pmloglib from '@enact/webos/pmloglib';
pmloglib.info('MonApp', 'MyKey', 'Message de log');
```

### LS2Request — Appels aux services Luna (webOS)
```js
import LS2Request from '@enact/webos/LS2Request';

// Appel simple
const req = new LS2Request().send({
  service: 'luna://com.webos.service.wifi',     // ou sans préfixe: 'com.webos.service.wifi'
  method: 'getStatus',
  parameters: { subscribe: false },
  onSuccess: (res) => {
    console.log('WiFi status:', res.isInternetConnectionAvailable);
  },
  onFailure: (err) => {
    console.error('Erreur:', err.errorText);
  },
  onComplete: (res) => { /* appelé dans tous les cas */ }
});

// Abonnement (subscribe: true) — reçoit des updates en continu
const subscription = new LS2Request().send({
  service: 'luna://com.webos.service.connectionmanager',
  method: 'getStatus',
  parameters: { subscribe: true },
  onSuccess: handleNetworkChange
});

// Annuler une requête ou se désabonner
req.cancel();
subscription.cancel();

// Services webOS courants:
// luna://com.webos.service.wifi          — WiFi
// luna://com.webos.service.bluetooth2    — Bluetooth
// luna://com.webos.service.tv.display    — Affichage/Résolution
// luna://com.webos.settingsservice       — Paramètres système
// luna://com.webos.service.applicationmanager — Gestion des apps
// luna://com.webos.service.db           — Base de données locale (db8)
```

### Pattern Redux + LS2Request
```js
// Action creator avec LS2Request
const fetchNetworkStatus = () => (dispatch) => {
  new LS2Request().send({
    service: 'luna://com.webos.service.connectionmanager',
    method: 'getStatus',
    parameters: { subscribe: false },
    onSuccess: (res) => dispatch({ type: 'NETWORK_STATUS', payload: res }),
    onFailure: (err) => dispatch({ type: 'NETWORK_ERROR', error: err.errorText })
  });
};
```

---

## 8. Bonnes pratiques générales

### Architecture de composants
```
src/
  App/               # Composant racine (ThemeDecorator)
  views/             # Panels / vues principales
  components/        # Composants réutilisables
    MyComponent/
      MyComponent.js       # kind() présentationnel
      MyComponent.module.less
      index.js             # export
  containers/        # Composants stateful (gestion d'état)
  store/             # Redux (actions, reducers, selectors)
```

### Séparation Présentationnel / Container
```js
// ✅ Composant présentationnel (kind) — reçoit tout via props
const UserCardBase = kind({
  name: 'UserCardBase',
  render: ({ name, avatar, onFollow }) => (
    <div>
      <Image src={avatar} />
      <BodyText>{name}</BodyText>
      <Button onClick={onFollow}>Suivre</Button>
    </div>
  )
});

// ✅ Container — gère l'état, connecté au store
const UserCard = connect(
  (state, { userId }) => ({ name: state.users[userId].name }),
  (dispatch) => ({ onFollow: (id) => dispatch(followUser(id)) })
)(UserCardBase);
```

### Conventions de nommage des props
```js
// ✅ Adjectifs pour les props descriptives
centered, justified, disabled, selected, active, hidden, loading

// ❌ Verbes
center, justify, disable, select, activate, hide, load

// ✅ Callbacks en présent
onClick, onChange, onToggle, onSelect, onClose, onOpen

// ❌ Callbacks au passé
onClicked, onChanged, onToggled

// ✅ Boolean : présence = true, défaut = false
<Button selected />   // selected === true
<Button />            // selected === false (absent)
```

### CSS et Less
```js
// ✅ Toujours utiliser CSS Modules
import css from './MyComponent.module.less';

// Dans kind() — styler gère la fusion automatique
const MyComponent = kind({
  styles: { css, className: 'myComponent' },
  computed: {
    // Ajouter des classes conditionnelles
    className: ({ active, styler }) => styler.append({ active })
  }
});

// ✅ Variables de résolution dans Less
.myComponent {
  height: ri.scale(100px);   // adapté HD/FHD/UHD
  font-size: ri.scale(24px);
}
```

### Tests
```bash
npm test                    # Tests unitaires (Jest + Testing Library)
npm run lint                # Analyse statique ESLint (conventions Enact)
```

```js
// Test d'un composant kind()
import { render } from '@testing-library/react';
import MyComponent from './MyComponent';

test('affiche le titre', () => {
  const { getByText } = render(<MyComponent title="Mon titre" />);
  expect(getByText('Mon titre')).toBeInTheDocument();
});
```

### Release
```bash
npm shrinkwrap    # Verrouiller les versions des dépendances avant release
npm run pack-p    # Build production optimisé
```

---

## 9. Patterns fréquents

### App complète minimale
```js
import kind from '@enact/core/kind';
import { Panel, Header, Panels } from '@enact/sandstone/Panels';
import Button from '@enact/sandstone/Button';
import ThemeDecorator from '@enact/sandstone/ThemeDecorator';
import React, { useState } from 'react';

const AppBase = kind({
  name: 'App',
  render: () => {
    const [index, setIndex] = useState(0);
    return (
      <Panels index={index} onBack={() => setIndex(i => i - 1)}>
        <Panel>
          <Header title="Accueil" />
          <Button onClick={() => setIndex(1)}>Voir détail</Button>
        </Panel>
        <Panel>
          <Header title="Détail" />
          <Button onClick={() => setIndex(0)}>Retour</Button>
        </Panel>
      </Panels>
    );
  }
});

export default ThemeDecorator(AppBase);
```

### VirtualList avec sélection
```js
import { VirtualList } from '@enact/sandstone/VirtualList';
import Item from '@enact/sandstone/Item';
import ri from '@enact/ui/resolution';
import React, { useState, useCallback } from 'react';

const MyList = ({ items }) => {
  const [selected, setSelected] = useState(null);

  const renderItem = useCallback(({ index, ...rest }) => (
    <Item
      {...rest}
      selected={selected === index}
      onClick={() => setSelected(index)}
    >
      {items[index].label}
    </Item>
  ), [items, selected]);

  return (
    <VirtualList
      dataSize={items.length}
      itemRenderer={renderItem}
      itemSize={ri.scale(144)}
    />
  );
};
```

### Popup avec focus piégé
```js
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';

// Popup Sandstone gère automatiquement le focus trap
const ConfirmDialog = ({ open, onConfirm, onCancel }) => (
  <Popup open={open} onClose={onCancel} title="Confirmer ?">
    <p>Voulez-vous continuer ?</p>
    <buttons>
      <Button onClick={onCancel}>Annuler</Button>
      <Button onClick={onConfirm}>Confirmer</Button>
    </buttons>
  </Popup>
);
```

### Navigation Spotlight manuelle entre zones
```js
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';
import Spotlight from '@enact/spotlight';

const Sidebar = SpotlightContainerDecorator({
  enterTo: 'last-focused',
  leaveFor: { right: '[data-container-id="main-content"] .spottable' }
}, 'nav');

const MainContent = SpotlightContainerDecorator({
  enterTo: 'last-focused',
  leaveFor: { left: '[data-container-id="sidebar"] .spottable' }
}, 'main');

const Layout = () => (
  <div>
    <Sidebar containerId="sidebar">
      <Button>Menu 1</Button>
      <Button>Menu 2</Button>
    </Sidebar>
    <MainContent containerId="main-content">
      <Button>Action 1</Button>
      <Button>Action 2</Button>
    </MainContent>
  </div>
);
```
