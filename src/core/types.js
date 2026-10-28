/**
 * @fileoverview Definições de Tipos JSDoc para o ecossistema googletype-osint.
 */

/**
 * @typedef {Object} TargetInfo
 * @property {string} raw - Alvo original fornecido
 * @property {boolean} isEmail - Se o alvo é um endereço de e-mail
 * @property {boolean} isGaiaId - Se o alvo é um Gaia ID numérico
 * @property {string} [email] - E-mail normalizado
 * @property {string} [username] - Parte local do e-mail
 * @property {string} [domain] - Domínio do e-mail
 * @property {boolean} [isGmail] - Se pertence ao domínio @gmail.com ou @googlemail.com
 * @property {string} [gaiaId] - Gaia ID numérico de 64 bits (se resolvido)
 */

/**
 * @typedef {Object} AvatarResult
 * @property {boolean} exists - Se um avatar foi localizado
 * @property {boolean} isDefault - Se é o avatar padrão do Google (letra inicial)
 * @property {string} [url] - URL pública padrão da imagem
 * @property {string} [originalHdUrl] - URL da imagem original em alta definição sem corte (=s0)
 * @property {string} [highResUrl] - URL da imagem em 1024x1024
 * @property {number} [durationMs] - Tempo da checagem em ms
 * @property {string} [error] - Mensagem de erro caso ocorra falha
 */

/**
 * @typedef {Object} GaiaResult
 * @property {boolean} exists - Se a conta do Google existe
 * @property {string} [gaiaId] - Gaia ID numérico descoberto
 * @property {string} [name] - Nome real ou de exibição público
 * @property {string} [profileUrl] - URL do perfil público
 * @property {string[]} [servicesDetected] - Serviços Google associados detectados
 * @property {number} [durationMs] - Duração da checagem em ms
 * @property {string} [error] - Mensagem de erro caso ocorra falha
 */

/**
 * @typedef {Object} MapsReview
 * @property {string} [id] - Identificador único da avaliação
 * @property {string} placeName - Nome do local ou estabelecimento
 * @property {string} [address] - Endereço completo ou cidade
 * @property {Object} coordinates
 * @property {number} coordinates.lat - Latitude
 * @property {number} coordinates.lng - Longitude
 * @property {number} [rating] - Nota de 1 a 5 estrelas
 * @property {string} [text] - Conteúdo da avaliação textual
 * @property {string} [date] - Data estimada ou timestamp
 * @property {string[]} [photos] - URLs de fotos anexadas pelo usuário
 * @property {string} [placeUrl] - Link direto do Google Maps para o local
 */

/**
 * @typedef {Object} MapsResult
 * @property {boolean} exists - Se o perfil de contribuidor do Maps foi encontrado
 * @property {boolean} isRestricted - Se as contribuições estão restritas ou ocultas
 * @property {string} [contributorUrl] - URL pública do perfil /maps/contrib/...
 * @property {number} [localGuideLevel] - Nível do programa Local Guides (0 a 10)
 * @property {number} totalReviews - Total de avaliações computadas
 * @property {number} totalPhotos - Total de fotos públicas enviadas
 * @property {number} totalRatings - Total de notas fornecidas
 * @property {MapsReview[]} reviews - Lista de avaliações extraídas com coordenadas
 * @property {GeoJSONFeatureCollection} [geojson] - GeoJSON padronizado com os pontos das avaliações
 * @property {number} [durationMs] - Duração da checagem em ms
 * @property {string} [error] - Mensagem de erro caso ocorra falha
 */

/**
 * @typedef {Object} CalendarEvent
 * @property {string} title - Título do evento
 * @property {string} [start] - Data/hora de início
 * @property {string} [end] - Data/hora de término
 * @property {string} [description] - Descrição pública do evento
 * @property {string} [location] - Localização física do evento
 */

/**
 * @typedef {Object} CalendarResult
 * @property {boolean} exists - Se a agenda existe
 * @property {boolean} isPublic - Se a agenda principal está exposta publicamente
 * @property {string} [title] - Nome/título da agenda pública
 * @property {string} [timeZone] - Fuso horário configurado
 * @property {string} [icsUrl] - URL do feed público iCalendar (.ics)
 * @property {string} [embedUrl] - URL pública de incorporação HTML
 * @property {CalendarEvent[]} events - Eventos públicos encontrados
 * @property {number} [durationMs] - Duração da checagem em ms
 * @property {string} [error] - Mensagem de erro caso ocorra falha
 */

/**
 * @typedef {Object} YouTubePlaylist
 * @property {string} id - ID da playlist
 * @property {string} title - Nome da playlist
 * @property {string} url - URL direta da playlist
 * @property {number} [videoCount] - Quantidade de vídeos
 */

/**
 * @typedef {Object} YouTubeResult
 * @property {boolean} exists - Se um canal ou atividade pública no YouTube foi identificada
 * @property {string} [channelId] - ID do canal (UC...)
 * @property {string} [channelUrl] - URL direta do canal
 * @property {string} [title] - Nome do canal
 * @property {string} [customUrl] - Handle / @nome público
 * @property {string} [avatarUrl] - Avatar do canal
 * @property {YouTubePlaylist[]} playlists - Playlists públicas encontradas
 * @property {number} [durationMs] - Duração da checagem em ms
 * @property {string} [error] - Mensagem de erro caso ocorra falha
 */

/**
 * @typedef {Object} GeoJSONGeometry
 * @property {'Point'} type
 * @property {[number, number]} coordinates - [longitude, latitude]
 */

/**
 * @typedef {Object} GeoJSONFeature
 * @property {'Feature'} type
 * @property {GeoJSONGeometry} geometry
 * @property {Record<string, any>} properties
 */

/**
 * @typedef {Object} GeoJSONFeatureCollection
 * @property {'FeatureCollection'} type
 * @property {GeoJSONFeature[]} features
 * @property {[number, number, number, number]} [bbox] - [minLng, minLat, maxLng, maxLat]
 * @property {Record<string, any>} [metadata]
 */

/**
 * @typedef {Object} InvestigationResult
 * @property {TargetInfo} target - Metadados de identificação do alvo
 * @property {AvatarResult} avatar - Metadados do avatar e fotos
 * @property {GaiaResult} gaia - Resolução do identificador interno e presença de conta
 * @property {MapsResult} maps - Contribuições do Google Maps e histórico de locais
 * @property {CalendarResult} calendar - Exposição de agenda pública e fuso horário
 * @property {YouTubeResult} youtube - Presença e conteúdo público no YouTube
 * @property {number} durationMs - Duração total da investigação em ms
 * @property {string} timestamp - Timestamp ISO do momento da execução
 */

export {};

