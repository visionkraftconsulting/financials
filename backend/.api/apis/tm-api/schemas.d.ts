declare const AiReports: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/AI%20Reports%20Token%20Info/get_v2_ai_reports_tokens) to access the list of token IDs. Example: 37493,3484";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols.  Example: APX,PAAL";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [10430];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["GHST"];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Aavegotchi"];
                            };
                            readonly INVESTMENT_ANALYSIS_POINTER: {
                                readonly type: "string";
                                readonly examples: readonly ["# Aavegotchi | Revolutionizing Play-to-Earn Gaming | Investment Analysis\n\n## Executive Summary\n- Aavegotchi is an innovative project merging decentralized finance (DeFi) with gaming, leveraging non-fungible tokens (NFTs) to create a unique play-to-earn ecosystem.\n- Built on the Ethereum blockchain, it allows users to collect, trade, and stake digital pets called Aavegotchis, backed by real assets in the form of Aave's aTokens.\n- With a strong community focus, a robust governance model, and sustainable tokenomics, Aavegotchi is poised to redefine the gaming landscape while providing real economic incentives for players.\n- The project has already demonstrated significant traction, with over $10 million in transactions and a total value locked (TVL) of around $20 million, reflecting user confidence and engagement.\n\n## About the Project\n\n### Vision\n- Aavegotchi envisions a future where gaming and finance converge, empowering players to earn real value through engaging gameplay and true ownership of digital assets.\n- The project aims to create a sustainable ecosystem that rewards players for their time and effort, fostering long-term engagement and growth.\n\n### Problem\n- Traditional gaming models often lack true ownership of in-game assets, leading to player dissatisfaction and transparency issues.\n- The complexity of crypto gaming can deter newcomers, while limited monetization opportunities fail to provide sustainable income for players.\n\n### Solution\n- Aavegotchi offers true ownership of digital assets through NFTs, allowing players to trade and stake their Aavegotchis freely.\n- The decentralized game economy promotes transparency and fairness, while user-friendly onboarding resources help newcomers navigate the crypto landscape.\n\n## Market Analysis\n- The NFT market was valued at approximately $41 billion in 2021 and is projected to exceed $80 billion by 2025.\n- The global gaming market, valued at around $159.3 billion in 2020, is expected to reach $200 billion by 2023.\n- Aavegotchi differentiates itself from competitors like Axie Infinity and Decentraland by integrating DeFi mechanics with gaming, offering unique financial incentives alongside engaging gameplay.\n\n## Features\n- **NFT Collectibles**: Unique digital pets that players can collect, trade, and customize, each with distinct traits and rarity levels.\n- **DeFi Integration**: Players can stake their Aavegotchis, backed by aTokens, earning yield while engaging in gameplay.\n- **Play-to-Earn Model**: Users can earn GHST tokens and other rewards through various in-game activities, incentivizing active participation.\n- **Community Governance**: A DAO allows GHST holders to propose and vote on changes, fostering a sense of ownership.\n- **Land Ownership**: Players can purchase and develop virtual land within the Gotchiverse, creating player-driven economies.\n- **Rarity Mechanics**: Each Aavegotchi's value is influenced by its traits and rarity, encouraging players to engage in rarity farming.\n- **Cross-Platform Compatibility**: Accessible across various devices, enhancing user experience and broadening its audience.\n\n## Technology\n- Aavegotchi's architecture is driven by modular smart contracts, known as the \"Aavegotchi diamond,\" allowing for easy upgrades and maintenance.\n- The project utilizes Ethereum for robust infrastructure and Polygon for layer-2 scaling, enhancing transaction speed and reducing costs.\n- Off-chain data storage is managed through IPFS, ensuring decentralization and immutability of asset metadata.\n\n### Key Technical Strengths\n- **Innovative Integration**: Combines DeFi mechanics with NFT ownership, enabling players to earn rewards through gameplay while holding unique digital assets.\n- **Chainlink VRF**: Utilizes Chainlink's Verifiable Random Function for randomization in Aavegotchi traits, enhancing the gaming experience.\n- **Active Codebase**: The codebase is maintained on GitHub, reflecting ongoing improvements and community involvement.\n- **User-Friendly Design**: The platform features an intuitive interface, facilitating interaction with the ecosystem for both new and experienced users.\n- **Scalable Architecture**: Modular design allows for seamless upgrades and the addition of new features, ensuring long-term adaptability.\n\n## Traction\n- Approximately 30,000 unique wallets are actively participating in the Aavegotchi ecosystem, showcasing a vibrant community.\n- Over $10 million in transactions have occurred since inception, with a total value locked (TVL) of around $20 million.\n- The project has experienced a 15% month-over-month growth rate in user activity, supported by positive community sentiment across platforms like Discord and Reddit.\n\n## Team\n- Co-founded by Jesse Johnson, who has extensive experience in blockchain and gaming, and supported by a skilled team with diverse expertise.\n- The team is committed to fostering a community-driven approach to development and innovation, ensuring the project's long-term success.\n\n## Investors\n- Aavegotchi raised $30 million during its ICO in September 2020, with strong community engagement contributing to its success.\n- Backed by the Aave Ecosystem Fund, the project continues to attract interest from various investors in the blockchain gaming space.\n\n## Conclusion\n- Aavegotchi represents a significant advancement in integrating gaming and decentralized finance, offering players a unique opportunity to earn while engaging with digital assets.\n- Its innovative features, strong community focus, and robust tokenomics position it as a noteworthy player in the blockchain gaming landscape.\n- With a commitment to user engagement and sustainable growth, Aavegotchi is well-positioned to maintain its competitive edge and redefine the intersection of gaming and finance."];
                            };
                            readonly INVESTMENT_ANALYSIS: {
                                readonly type: "string";
                                readonly examples: readonly ["# Aavegotchi | Revolutionizing Play-to-Earn Gaming | Investment Analysis\n\n## Executive Summary\nAavegotchi is at the forefront of the play-to-earn revolution, merging decentralized finance (DeFi) with gaming through unique non-fungible tokens (NFTs). By allowing players to collect, trade, and stake digital pets backed by real assets, Aavegotchi offers a compelling ecosystem that not only engages users but also provides tangible economic incentives. With a robust community, innovative governance, and a strong tokenomics model, Aavegotchi is poised to redefine the gaming landscape while delivering real value to its players.\n\nAs the NFT market continues to expand, projected to exceed $80 billion by 2025, Aavegotchi stands out by integrating financial mechanics into its gameplay. With approximately 30,000 active wallets and a total value locked (TVL) of around $20 million, the project showcases impressive user engagement and growth potential. Aavegotchi's commitment to community-driven development and continuous innovation positions it as a significant player in the evolving blockchain gaming sector.\n\n## About the Project\n\n### Vision\nAavegotchi envisions a future where gaming and finance seamlessly converge, empowering players to earn real value through engaging gameplay. By integrating DeFi mechanics with NFTs, the project aims to foster true ownership of digital assets while cultivating a vibrant community. The ultimate goal is to create a sustainable ecosystem that rewards players for their time and effort, ensuring long-term engagement and growth.\n\n### Problem\nTraditional gaming models often leave players feeling disenfranchised due to a lack of true ownership of in-game assets. Centralized economies can lead to transparency issues and unfair advantages, while the complexity of crypto gaming can deter newcomers. Additionally, limited monetization opportunities create barriers to entry, preventing players from realizing sustainable income through their gaming experiences.\n\n### Solution\nAavegotchi addresses these challenges by offering true ownership of digital assets through NFTs, enabling players to freely buy, sell, and trade their Aavegotchis. The decentralized game economy promotes transparency and fairness, while user-friendly onboarding resources assist newcomers in navigating the crypto landscape. The play-to-earn model incentivizes engagement, allowing players to earn rewards through gameplay and staking, thereby creating sustainable income opportunities.\n\n## Market Analysis\nThe NFT market has experienced explosive growth, valued at approximately $41 billion in 2021 and projected to exceed $80 billion by 2025. The global gaming market, valued at around $159.3 billion in 2020, is expected to reach $200 billion by 2023. Aavegotchi differentiates itself from competitors like Axie Infinity and Decentraland by integrating DeFi mechanics with gaming, offering players unique financial incentives alongside engaging gameplay.\n\n## Features\n- **NFT Collectibles**: Aavegotchis are unique digital pets that players can collect, trade, and customize, each with distinct traits and rarity levels.\n- **DeFi Integration**: Players can stake their Aavegotchis, which are backed by aTokens, allowing them to earn yield while engaging in gameplay.\n- **Play-to-Earn Model**: Users can earn GHST tokens and other rewards through various in-game activities, incentivizing active participation.\n- **Community Governance**: Aavegotchi employs a DAO, allowing GHST holders to propose and vote on changes, fostering a sense of ownership.\n- **Land Ownership**: Players can purchase and develop virtual land within the Gotchiverse, creating player-driven economies and enhancing the gaming experience.\n- **Rarity Mechanics**: Each Aavegotchi's value is influenced by its traits and rarity, encouraging players to engage in rarity farming.\n- **Cross-Platform Compatibility**: Aavegotchi is accessible across various devices, enhancing user experience and broadening its audience.\n\n## Token\nThe native token of Aavegotchi is GHST, an ERC-20 token that serves as the primary currency within the ecosystem. The total supply is capped at 3 million tokens, with a circulating supply that varies based on user engagement. GHST is used for purchasing Aavegotchis, staking, and participating in governance. The tokenomics include allocations for community incentives, development, and liquidity pools, ensuring a balanced distribution that supports long-term sustainability.\n\n## Traction\nAavegotchi has approximately 30,000 unique wallets actively participating in its ecosystem, with over $10 million in transactions since its inception. The total value locked (TVL) in the platform is around $20 million, reflecting user confidence and engagement. The project has experienced a 15% month-over-month growth rate in user activity, supported by a vibrant community across platforms like Discord and Reddit, where engagement and sentiment remain positive.\n\n## Team\nAavegotchi was co-founded by Jesse Johnson, who has extensive experience in blockchain and gaming. Key team member Dan, known as Coder Dan, is a full-stack developer with a background in DeFi applications. The team comprises individuals with diverse expertise in technology, finance, and gaming, committed to fostering a community-driven approach to development and innovation.\n\n## Technology\nAavegotchi's architecture is primarily driven by smart contracts, which govern the creation, trading, and interaction of Aavegotchis. The project employs a modular smart contract design, known as the \"Aavegotchi diamond,\" allowing for easy upgrades and maintenance. Utilizing Ethereum for its robust infrastructure and Polygon for layer-2 scaling enhances transaction speed and reduces costs. The use of IPFS for off-chain data storage ensures decentralization and immutability of asset metadata.\n\nKey technical strengths include:\n- **Innovative DeFi Integration**: Merges financial incentives with gaming, allowing players to earn rewards through gameplay.\n- **Modular Smart Contract Design**: Facilitates easy upgrades and maintenance, ensuring adaptability to market changes.\n- **Chainlink VRF**: Ensures randomness in rarity and traits, enhancing the uniqueness of each Aavegotchi.\n- **Cross-Platform Accessibility**: Enhances user experience by allowing engagement from various devices.\n- **Active Community Engagement**: Regular updates and community involvement ensure transparency and responsiveness to user needs.\n\n## Conclusion\nAavegotchi presents a compelling investment opportunity at the intersection of gaming and decentralized finance. Its innovative features, strong community focus, and robust tokenomics position it as a noteworthy player in the blockchain gaming landscape. Coupled with its technical strengths and commitment to continuous improvement, Aavegotchi is well-positioned to redefine the gaming experience while providing real economic incentives for players. Investors should consider Aavegotchi as a promising addition to their portfolios, given its unique approach and growth potential in a rapidly evolving market."];
                            };
                            readonly DEEP_DIVE: {
                                readonly type: "string";
                                readonly examples: readonly ["# Aavegotchi | Play-to-Earn NFT Revolution | Crypto Deep Dive\n\n## Executive Summary\nAavegotchi is a pioneering project at the intersection of decentralized finance (DeFi) and gaming, utilizing non-fungible tokens (NFTs) to create a unique play-to-earn ecosystem. Built on the Ethereum blockchain, Aavegotchi allows users to collect, trade, and stake digital pets, known as Aavegotchis, which are backed by real assets in the form of Aave's aTokens. With a strong community focus, innovative governance model, and robust tokenomics, Aavegotchi aims to redefine the gaming landscape while providing real economic incentives for players.\n\n## About the Project\n\n### Vision\nAavegotchi envisions a future where gaming and finance converge, allowing players to earn real value through engaging gameplay. By integrating DeFi mechanics with NFTs, the project aims to empower users to take ownership of their digital assets while participating in a vibrant community. The ultimate goal is to create a sustainable ecosystem that rewards players for their time and effort, fostering long-term engagement and growth.\n\n### Problem\nTraditional gaming models often lack true ownership of in-game assets, leaving players dissatisfied with their investment of time and money. Additionally, centralized game economies can lead to transparency issues and unfair advantages. The complexity of crypto gaming can deter newcomers, and limited monetization opportunities often fail to provide sustainable income for players, creating barriers to entry in the gaming and crypto spaces.\n\n### Solution\nAavegotchi addresses these challenges by offering true ownership of digital assets through NFTs, allowing players to buy, sell, and trade their Aavegotchis freely. The decentralized game economy promotes transparency and fairness, while user-friendly onboarding resources help newcomers navigate the crypto landscape. The play-to-earn model incentivizes engagement, enabling players to earn rewards through gameplay and staking, thus creating sustainable income opportunities.\n\n## Market Analysis\nThe NFT market has seen explosive growth, valued at approximately $41 billion in 2021 and projected to exceed $80 billion by 2025. The global gaming market, valued at around $159.3 billion in 2020, is expected to reach $200 billion by 2023. Aavegotchi stands out in this competitive landscape, differentiating itself from key competitors like Axie Infinity and Decentraland by integrating DeFi mechanics with gaming, offering players unique financial incentives alongside engaging gameplay.\n\n## Features\n- **NFT Collectibles**: Aavegotchis are unique digital pets that players can collect, trade, and customize, each with distinct traits and rarity levels.\n- **DeFi Integration**: Players can stake their Aavegotchis, which are backed by aTokens, allowing them to earn yield while engaging in gameplay.\n- **Play-to-Earn Model**: Users can earn GHST tokens and other rewards through various in-game activities, incentivizing active participation.\n- **Community Governance**: Aavegotchi employs a DAO, allowing GHST holders to propose and vote on changes, fostering a sense of ownership.\n- **Land Ownership**: Players can purchase and develop virtual land within the Gotchiverse, creating player-driven economies and enhancing the gaming experience.\n- **Rarity Mechanics**: Each Aavegotchi's value is influenced by its traits and rarity, encouraging players to engage in rarity farming.\n- **Cross-Platform Compatibility**: Aavegotchi is accessible across various devices, enhancing user experience and broadening its audience.\n\n## Token\nThe native token of Aavegotchi is GHST, an ERC-20 token that serves as the primary currency within the ecosystem. The total supply is capped at 3 million tokens, with a circulating supply that varies based on user engagement. GHST is used for purchasing Aavegotchis, staking, and participating in governance. The tokenomics include allocations for community incentives, development, and liquidity pools, ensuring a balanced distribution that supports long-term sustainability.\n\n## Traction\nAavegotchi has approximately 30,000 unique wallets actively participating in its ecosystem, with over $10 million in transactions since its inception. The total value locked (TVL) in the platform is around $20 million, reflecting user confidence and engagement. The project has experienced a 15% month-over-month growth rate in user activity, supported by a vibrant community across platforms like Discord and Reddit, where engagement and sentiment remain positive.\n\n## Team\nAavegotchi was co-founded by Jesse Johnson, who has extensive experience in blockchain and gaming. Key team member Dan, known as Coder Dan, is a full-stack developer with a background in DeFi applications. The team comprises individuals with diverse expertise in technology, finance, and gaming, committed to fostering a community-driven approach to development and innovation.\n\n## Investors\nAavegotchi raised $30 million during its ICO in September 2020, with strong community engagement contributing to its success. The project has received backing from the Aave Ecosystem Fund, which supports initiatives that enhance the Aave protocol. While specific details about later funding rounds are less documented, the project continues to attract interest from various investors in the blockchain gaming space.\n\n## Conclusion\nAavegotchi represents a significant advancement in the integration of gaming and decentralized finance, offering players a unique opportunity to earn while engaging with digital assets. Its innovative features, strong community focus, and robust tokenomics position it as a noteworthy player in the blockchain gaming landscape. As the project continues to evolve, its commitment to user engagement and sustainable growth will be crucial for maintaining its competitive edge. For more information, visit [aavegotchi.com](https://aavegotchi.com)."];
                            };
                            readonly CODE_REVIEW: {
                                readonly type: "string";
                                readonly examples: readonly ["# Aavegotchi | DeFi Meets Gaming | Code Review\n\n## Introduction\nAavegotchi is an innovative project that merges decentralized finance (DeFi) with non-fungible tokens (NFTs), creating a unique play-to-earn gaming ecosystem. Built on the Ethereum blockchain, Aavegotchi allows players to collect and stake digital pets, known as Aavegotchis, which are backed by real assets in the form of Aave's aTokens. This integration of gaming and financial incentives positions Aavegotchi as a significant player in the evolving landscape of blockchain technology.\n\n## Innovation\nAavegotchi stands out by combining DeFi mechanics with NFT ownership, allowing players to earn rewards through gameplay while holding unique digital assets. Each Aavegotchi is a distinct NFT characterized by various traits and rarity levels, determined through a randomization process using Chainlink's Verifiable Random Function (VRF). This innovative approach not only enhances the gaming experience but also provides players with real economic incentives, creating a sustainable model that benefits both users and the platform.\n\n## Architecture\nThe Aavegotchi architecture is primarily driven by smart contracts, which govern the creation, trading, and interaction of Aavegotchis. The project employs a modular smart contract design, known as the \"Aavegotchi diamond,\" which allows for easy upgrades and maintenance. Additionally, Aavegotchi utilizes Ethereum for its robust infrastructure and Polygon for layer-2 scaling, enhancing transaction speed and reducing costs. The use of IPFS for off-chain data storage ensures decentralization and immutability of asset metadata.\n\n## Code Quality\nAavegotchi's codebase is primarily written in Solidity, the standard programming language for Ethereum smart contracts. The repository is actively maintained on GitHub, showcasing a commitment to transparency and community involvement. Regular updates and a detailed changelog reflect ongoing improvements in functionality and performance. The smart contracts are designed to manage various aspects of the ecosystem, including staking, governance, and marketplace transactions, ensuring secure and efficient interactions among users.\n\n## Product Roadmap\nAavegotchi's roadmap outlines ambitious plans for expanding the Gotchiverse, introducing new gameplay features, and enhancing community governance through the Aavegotchi DAO. Upcoming features include mini-games, land ownership, and enhanced customization options for Aavegotchis. The integration of additional DeFi protocols is also planned to increase the utility of Aavegotchis, allowing players to stake more assets and earn rewards. Regular updates and community engagement initiatives are integral to the project's growth strategy.\n\n## Usability\nThe Aavegotchi platform is designed for user engagement, featuring a user-friendly interface that facilitates interaction with the ecosystem. Players can easily purchase, stake, and trade Aavegotchis using the GHST token, the native currency of the platform. The integration of educational resources and community events helps onboard new users and fosters a sense of belonging. Cross-platform compatibility further enhances accessibility, allowing players to engage with Aavegotchi from various devices.\n\n## Team\nAavegotchi was co-founded by Jesse Johnson, who has extensive experience in blockchain and gaming. The development team includes skilled individuals with backgrounds in technology, finance, and community engagement. Their collective expertise is crucial for driving innovation and ensuring the project's long-term success. The team's commitment to community involvement is reflected in their governance model, which empowers users to participate in decision-making processes.\n\n## Conclusion\nAavegotchi demonstrates significant technical strengths through its innovative integration of DeFi and NFTs, robust architecture, and active community engagement. The modular smart contract design and commitment to transparency enhance its reliability and adaptability. However, continuous innovation and responsiveness to market trends will be essential for maintaining its competitive edge in the rapidly evolving blockchain gaming landscape. Aavegotchi is well-positioned to redefine the intersection of gaming and finance, offering a compelling model for future projects."];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const AllTrendIndicators: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly default: "3375,3306";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC,ETH";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols.";
                };
                readonly indicator: {
                    readonly type: "string";
                    readonly default: "mama,mom";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated indicator name. Click [here](https://api.tokenmetrics.com/api-docs/#/Technical%20Indicators/get_v2_technical_indicators) to access the list of technical indicators.";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly default: "2023-10-01";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly default: "2023-10-10";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1000;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 0;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 0 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [1000];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [4];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Zoidpay"];
                            };
                            readonly SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["zpay"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2023-06-11"];
                            };
                            readonly INDICATOR: {
                                readonly type: "string";
                                readonly examples: readonly ["adosc"];
                            };
                            readonly TREND: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [-1];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const AnnualizedHistoricalVolatilityCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "MAX";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "market_cap, volatility_index, 90th_percentile, 10th_percentile";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** market_cap, volatility_index, 90th_percentile, 10th_percentile";
                };
            };
            readonly required: readonly ["timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/annualizedHistoricalVolatilityCharts/chart_1708519983951.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinVsAltcoinSeasonCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "Y";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "altcoin_indicator,altcoin_season,bitcoin_season";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:**altcoin_indicator,altcoin_season,bitcoin_season";
                };
            };
            readonly required: readonly ["timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/bitcoinVsAltcoinSeasonCharts/chart_1708519796455.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Correlation: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly category: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories. Example: layer-1,nft";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges. Example: gate,binance";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [972];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [28950];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Gosleep Zzz"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ZZZ"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2023-11-08"];
                            };
                            readonly TOP_CORRELATION: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly correlation: {
                                            readonly type: "number";
                                            readonly default: 0;
                                            readonly examples: readonly [0.846];
                                        };
                                        readonly token: {
                                            readonly type: "string";
                                            readonly examples: readonly ["Fantom"];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CryptoInvestors: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly INVESTOR_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["0x Labs"];
                            };
                            readonly INVESTOR_WEBSITE: {
                                readonly type: "string";
                                readonly examples: readonly ["https://0x.org/"];
                            };
                            readonly INVESTOR_TWITTER: {
                                readonly type: "string";
                                readonly examples: readonly ["https://x.com/0xproject"];
                            };
                            readonly ROUND_COUNT: {
                                readonly type: "string";
                                readonly examples: readonly ["2"];
                            };
                            readonly ROI_AVERAGE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [-0.79179406];
                            };
                            readonly ROI_MEDIAN: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [-0.79179406];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const DailyOhlcv: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC";
                };
                readonly token_name: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Crypto Asset Names (e.g., Bitcoin, Ethereum). Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token names. Example: Bitcoin";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Note: The Start Date cannot be earlier than the past 30 days from the current date. Example: 2025-01-01";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2025-01-23";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [44003];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["GIVER"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["GIVER"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-26T00:00:00.000Z"];
                            };
                            readonly OPEN: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.0022746];
                            };
                            readonly HIGH: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.00246369];
                            };
                            readonly LOW: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.00227402];
                            };
                            readonly CLOSE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.0024467];
                            };
                            readonly VOLUME: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [816.32153];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const HourlyOhlcv: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly token_name: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Crypto Asset Names (e.g., Bitcoin, Ethereum). Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token names. Example: Bitcoin, Ethereum";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Note: The Start Date cannot be earlier than the past 30 days from the current date. Example: 2025-03-01";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2025-03-20";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [66];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["TRONPAD"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["TRONPAD"];
                            };
                            readonly TIMESTAMP: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-26T11:00:00.000Z"];
                            };
                            readonly OPEN: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.00139286];
                            };
                            readonly HIGH: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.00139414];
                            };
                            readonly LOW: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.00139285];
                            };
                            readonly CLOSE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.00139414];
                            };
                            readonly VOLUME: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [6.9021335];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const IndexHoldings: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly default: "trader";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type of market perspective, either trader or investor";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 0;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 0 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly ["type"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [5];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["GST-SOL"];
                            };
                            readonly ICON: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly large: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/21841/large/gst.png?1696521196"];
                                    };
                                    readonly small: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/21841/small/gst.png?1696521196"];
                                    };
                                    readonly thumb: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/21841/thumb/gst.png?1696521196"];
                                    };
                                };
                            };
                            readonly WEIGHT: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [25];
                            };
                            readonly PCT_CHANGE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [-0.12];
                            };
                            readonly CG_ID: {
                                readonly type: "string";
                                readonly examples: readonly ["green-satoshi-token"];
                            };
                            readonly CHAIN_ID: {
                                readonly type: "string";
                                readonly examples: readonly ["1151111081099710"];
                            };
                            readonly TOKEN_ADDRESS: {
                                readonly type: "string";
                                readonly examples: readonly ["AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB"];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const IndexSpecificPerformance: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly indexName: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Index Name for Retrieving the performance data. Example: meme";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Example: 2025-01-15";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2025-03-28";
                };
            };
            readonly required: readonly ["indexName", "startDate", "endDate"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [73];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-01-15T00:00:00.000Z"];
                            };
                            readonly INDEX_CUMULATIVE_ROI: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [-0.596226];
                            };
                            readonly MARKET_CAP: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [45845784];
                            };
                            readonly VOLUME: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [7046967.5];
                            };
                            readonly FDV: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [39287404];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const IndicesIndexAllocationCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly category: {
                    readonly type: "string";
                    readonly default: "trader";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type of market perspective, either trader or investor";
                };
            };
            readonly required: readonly ["category"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/indices/indicesIndexAllocationcharts/chart_1708517380012.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const IndicesPerformance: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly default: "trader";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type of market perspective, either trader or investor";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly default: "2025-01-15";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format.";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly default: "2025-03-28";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format.";
                };
            };
            readonly required: readonly ["type", "startDate", "endDate"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [63];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-01-15T00:00:00.000Z"];
                            };
                            readonly INDEX_CUMULATIVE_ROI: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.3853318362];
                            };
                            readonly MARKET_CAP: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [580194141.65945];
                            };
                            readonly VOLUME: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [32676385.998644];
                            };
                            readonly FDV: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [625247551.171164];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const IndicesRoiCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly category: {
                    readonly type: "string";
                    readonly default: "trader";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type of market perspective, either trader or investor";
                };
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "MAX";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, YTD, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "backtested_roi, index_roi,btc_roi,total_market_roi";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** backtested_roi,index_roi,btc_roi,total_market_roi";
                };
            };
            readonly required: readonly ["category", "timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/indices/indicesRoicharts/chart_1708438004713.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const IndicesTransaction: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly default: "trader";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type of market perspective, either trader or investor";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 0;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 0 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly ["type"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [1];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-03-17T00:00:00.000Z"];
                            };
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [42356];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["PYTHIA"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["PYTHIA"];
                            };
                            readonly ICON: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly large: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/53301/large/PYTHIA-Coingecko.png?1736062694"];
                                    };
                                    readonly small: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/53301/small/PYTHIA-Coingecko.png?1736062694"];
                                    };
                                    readonly thumb: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/53301/thumb/PYTHIA-Coingecko.png?1736062694"];
                                    };
                                };
                            };
                            readonly ACTION: {
                                readonly type: "string";
                                readonly examples: readonly ["Decrease"];
                            };
                            readonly TRANSACTION_SIZE_IN_PCT: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [7.537089421];
                            };
                            readonly TRANSACTION_SIZE_IN_USD: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.2430624743];
                            };
                            readonly TRANSACTION_SIZE_IN_TOKENS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [20.794760924];
                            };
                            readonly TIMESTAMP: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-03-17T00:00:00.000Z"];
                            };
                            readonly TOTAL_COUNT: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [1];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const InvestorGrades: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Example: 2025-01-01";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2025-02-27";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly category: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories. Example: layer-1,nft";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges. Example: binance,gate";
                };
                readonly marketcap: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum MarketCap in $. Example: 100";
                };
                readonly fdv: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum fully diluted valuation in $. Example: 100";
                };
                readonly volume: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum 24h trading volume in $. Example: 100";
                };
                readonly investorGrade: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum TM Investor Grade. Example: 70";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [10];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3455];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["aelf"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ELF"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2024-04-29"];
                            };
                            readonly TM_INVESTOR_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [62.83];
                            };
                            readonly TM_INVESTOR_GRADE_7D_PCT_CHANGE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.54];
                            };
                            readonly FUNDAMENTAL_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [75.39];
                            };
                            readonly TECHNOLOGY_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [74.37];
                            };
                            readonly VALUATION_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [35.6];
                            };
                            readonly DEFI_USAGE_SCORE: {};
                            readonly COMMUNITY_SCORE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [6.02];
                            };
                            readonly EXCHANGE_SCORE: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [10];
                            };
                            readonly VC_SCORE: {};
                            readonly TOKENOMICS_SCORE: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [10];
                            };
                            readonly DEFI_SCANNER_SCORE: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [10];
                            };
                            readonly ACTIVITY_SCORE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [8.16];
                            };
                            readonly SECURITY_SCORE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [4.1];
                            };
                            readonly REPOSITORY_SCORE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [7.8];
                            };
                            readonly COLLABORATION_SCORE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [7.4];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const InvestorIndices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1000;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 0;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 0 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [40];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly PORTFOLIO_DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2023-01-01"];
                            };
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3306];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Ethereum"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ETH"];
                            };
                            readonly INDEX_WEIGHT: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.007720578744];
                            };
                            readonly INITIAL_PRICE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1200.65];
                            };
                            readonly AMOUNT_OF_TOKENS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.06430332523];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const MarketBullAndBearCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/bullAndBearCharts/chart_1708518469588.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const MarketMetrics: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Example: 2023-10-01";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2023-10-10";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response.";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-24"];
                            };
                            readonly TOTAL_CRYPTO_MCAP: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3512898000000];
                            };
                            readonly TM_GRADE_PERC_HIGH_COINS: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [52];
                            };
                            readonly TM_GRADE_SIGNAL: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [0];
                            };
                            readonly LAST_TM_GRADE_SIGNAL: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [1];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const MarketMoversCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "negativeDailyPricePercentageChange,positiveDailyPricePercentageChange";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** negativeDailyPricePercentageChange,positiveDailyPricePercentageChange";
                };
            };
            readonly required: readonly ["chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/marketMoversCharts/chart_1708521015929.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const MarketPercentOfBullishTmGrades: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "Y";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "total_crypto_market,  percent_of_bullish_tm_grades";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** total_crypto_market,  percent_of_bullish_tm_grades";
                };
            };
            readonly required: readonly ["timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/totalCryptoMarketCapCharts/chart_1708518721963.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const MarketPercentOfBullishVsBearishCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/percentOfBullishVsBearishCharts/chart_1708518157748.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const MarketTmGradeSignal: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "Y";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "total_crypto_market,  bullish, bearish";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** total_crypto_market,  bullish, bearish";
                };
            };
            readonly required: readonly ["timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/marketMoversCharts/chart_1708519518660.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Price: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3306];
                            };
                            readonly CURRENT_PRICE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [2567.75];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Ethereum"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["eth"];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PricePrediction: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly default: "3375,3306";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC,ETH";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols.";
                };
                readonly category: {
                    readonly type: "string";
                    readonly default: "layer-1,nft";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories.";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "binance,gate";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1000;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 0;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 0 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [14223];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["PancakeSwap"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2024-06-11"];
                            };
                            readonly FORECASTS_FOR_NEXT_7_DAYS: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly "1-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.955477522468498];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.15168433897629];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [3.752253335204243];
                                            };
                                        };
                                    };
                                    readonly "2-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.900011453753576];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.001482408412628];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [3.823180064253144];
                                            };
                                        };
                                    };
                                    readonly "3-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.7352038637972];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [1.740803846906033];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [3.780126425887028];
                                            };
                                        };
                                    };
                                    readonly "4-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.710885142018935];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [1.567173814446756];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [3.87715730323831];
                                            };
                                        };
                                    };
                                    readonly "5-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.71446914205757];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [1.423207528997107];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [4.012993083095056];
                                            };
                                        };
                                    };
                                    readonly "6-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.663624785489615];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [1.299384619963853];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [4.033013349563843];
                                            };
                                        };
                                    };
                                    readonly "7-day-forecast": {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly forecast: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [2.653010321629962];
                                            };
                                            readonly forecast_lower: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [1.189203628379838];
                                            };
                                            readonly forecast_upper: {
                                                readonly type: "number";
                                                readonly default: 0;
                                                readonly examples: readonly [4.147191711323936];
                                            };
                                        };
                                    };
                                };
                            };
                            readonly PREDICTED_RETURNS_7D: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.0243];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Quantmetrics: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly category: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories. Example: layer-1,nft";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges. Example: binance,gate";
                };
                readonly marketcap: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum MarketCap in $. Example: 100000000";
                };
                readonly volume: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum 24h trading volume in $. Example: 100000000";
                };
                readonly fdv: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum fully diluted valuation in $. Example: 100000000";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3306];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Ethereum"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ETH"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-26"];
                            };
                            readonly VOLATILITY: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.93];
                            };
                            readonly ALL_TIME_RETURN: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1823.75];
                            };
                            readonly CAGR: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.7];
                            };
                            readonly SHARPE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1.02];
                            };
                            readonly SORTINO: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1.66];
                            };
                            readonly MAX_DRAWDOWN: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [-0.94];
                            };
                            readonly SKEW: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1.19];
                            };
                            readonly TAIL_RATIO: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1.22];
                            };
                            readonly RISK_REWARD_RATIO: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [16.442680776];
                            };
                            readonly PROFIT_FACTOR: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1.23];
                            };
                            readonly KURTOSIS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [13.98];
                            };
                            readonly DAILY_VALUE_AT_RISK: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [-0.09];
                            };
                            readonly DAILY_RETURN_AVG: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.003771331];
                            };
                            readonly DAILY_RETURN_STD: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.058577169];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ResistanceAndSupportCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly default: "16294";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs.";
                };
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "3M";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "linear_scale";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** linear_scale or log_scale";
                };
            };
            readonly required: readonly ["token_id", "timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/resistanceAndSupport/chart_1725454451659.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ResistanceSupport: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3306];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Ethereum"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ETH"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-26T00:00:00.000Z"];
                            };
                            readonly HISTORICAL_RESISTANCE_SUPPORT_LEVELS: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly date: {
                                            readonly type: "string";
                                            readonly examples: readonly ["2017-08-09"];
                                        };
                                        readonly level: {
                                            readonly type: "number";
                                            readonly default: 0;
                                            readonly examples: readonly [316.5];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ScenarioAnalysis: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3306];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Ethereum"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ETH"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-26"];
                            };
                            readonly SCENARIO_ANALYSIS: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly token_dominance: {
                                            readonly type: "number";
                                            readonly default: 0;
                                            readonly examples: readonly [0.8702744893346861];
                                        };
                                        readonly price_prediction: {
                                            readonly type: "number";
                                            readonly default: 0;
                                            readonly examples: readonly [72094.99938805234];
                                        };
                                        readonly crypto_market_cap_trillion: {
                                            readonly type: "integer";
                                            readonly default: 0;
                                            readonly examples: readonly [10];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SectorIndexTransaction: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly indexName: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Index Name for Retrieving the index transaction. Example: meme";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly ["indexName"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [1];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-03-17T00:00:00.000Z"];
                            };
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [41337];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Alchemist AI"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ALCH"];
                            };
                            readonly ICON: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly large: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/52302/large/small-logo.png?1733053544"];
                                    };
                                    readonly small: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/52302/small/small-logo.png?1733053544"];
                                    };
                                    readonly thumb: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/52302/thumb/small-logo.png?1733053544"];
                                    };
                                };
                            };
                            readonly ACTION: {
                                readonly type: "string";
                                readonly examples: readonly ["Decrease"];
                            };
                            readonly TRANSACTION_SIZE_IN_PCT: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.9540914727];
                            };
                            readonly TRANSACTION_SIZE_IN_USD: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.02721842297];
                            };
                            readonly TRANSACTION_SIZE_IN_TOKENS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.406123888];
                            };
                            readonly SECTOR: {
                                readonly type: "string";
                                readonly examples: readonly ["Meme"];
                            };
                            readonly TIMESTAMP: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-03-17T00:00:00.000Z"];
                            };
                            readonly TOTAL_COUNT: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [1];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SectorIndicesHoldings: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly indexName: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Index Name for Retrieving the Tree Map. Example: meme";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly ["indexName"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [4];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["NPC"];
                            };
                            readonly ICON: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly large: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/31193/large/NPC_200x200.png?1696530021"];
                                    };
                                    readonly small: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/31193/small/NPC_200x200.png?1696530021"];
                                    };
                                    readonly thumb: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://coin-images.coingecko.com/coins/images/31193/thumb/NPC_200x200.png?1696530021"];
                                    };
                                };
                            };
                            readonly WEIGHT: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [25];
                            };
                            readonly PCT_CHANGE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.27];
                            };
                            readonly CG_ID: {
                                readonly type: "string";
                                readonly examples: readonly ["non-playable-coin"];
                            };
                            readonly CHAIN_ID: {
                                readonly type: "string";
                                readonly examples: readonly ["1151111081099710"];
                            };
                            readonly TOKEN_ADDRESS: {
                                readonly type: "string";
                                readonly examples: readonly ["BeGY8KqKxboEwRbJd1q9H2K829jS4Rc5dEyNMYXCbV5p"];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Sentiments: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [1];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly DATETIME: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-02-21T15:00:00.000Z"];
                            };
                            readonly MARKET_SENTIMENT_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [56.78];
                            };
                            readonly MARKET_SENTIMENT_LABEL: {
                                readonly type: "string";
                                readonly examples: readonly ["neutral"];
                            };
                            readonly NEWS_SENTIMENT_GRADE: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [54];
                            };
                            readonly NEWS_SENTIMENT_LABEL: {
                                readonly type: "string";
                                readonly examples: readonly ["neutral"];
                            };
                            readonly NEWS_SUMMARY: {
                                readonly type: "string";
                                readonly examples: readonly ["In the cryptocurrency markets this week, several key developments have taken place. SG-FORGE launched a MiCA-compliant EUR stablecoin on the Stellar Network, while Kraken is considering launching a USD stablecoin due to MiCA regulations potentially affecting USDT. A buy alert for Stellar (XLM) was issued, signaling a potential rally. FTX creditors in various countries were excluded from reimbursements, and the SEC established a new cyber and technology unit to regulate the cryptocurrency space. XRP's price prediction of reaching an all-time high and a dip in Pi coin by 65% were also notable events. Coinbase scored a win as the SEC is set to drop a lawsuit against them, while a woman was sentenced for committing fraud against Bybit. Franklin Templeton launched a mixed Bitcoin and Ethereum exchange-traded fund, and Sora Ventures announced a Bitcoin yield strategy for Asia. Gary Cardone dumped his XRP position, and the Shannon Testnet by Somnia achieved over 1 million transactions per second. Bitcoin crossed the $99,000 mark, and speculation surrounded Ripple's potential SEC lawsuit. Solana's memecoin stumble could boost Ethereum, and Melania Memecoin gained attention. Littlebit, a platform for micro-savings in Bitcoin, also garnered interest. Overall, the cryptocurrency markets were abuzz with various developments and challenges facing the industry."];
                            };
                            readonly REDDIT_SENTIMENT_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [52.3];
                            };
                            readonly REDDIT_SENTIMENT_LABEL: {
                                readonly type: "string";
                                readonly examples: readonly ["neutral"];
                            };
                            readonly REDDIT_SUMMARY: {
                                readonly type: "string";
                                readonly examples: readonly ["In the latest news related to the cryptocurrency markets, several key developments have taken place that are shaping the landscape of digital assets. Ethereum has hit a new all-time high due to the surge in demand for DeFi projects, while Ripple is facing a lawsuit from the SEC over XRP token sales. Dogecoin has seen a massive surge in value following tweets from Elon Musk, and Litecoin has announced a partnership with UFC for a sponsorship deal. Additionally, Cardano has released a new update for smart contract capabilities.\n\nThe market remains dynamic and full of opportunities for investors and traders, with Bitcoin prices continuing to be volatile and the rise of decentralized finance (DeFi) platforms being a significant topic of discussion. The surge in the price of various digital assets, the popularity of DeFi projects, and the impact of regulatory developments on the cryptocurrency industry are all key highlights in the cryptocurrency community.\n\nFurthermore, the issue of sanctions affecting transactions between Coinbase and MetaMask, the emergence of Pi Network for mining Pi coins on smartphones, and the launch of The Pixel Game for art and crypto enthusiasts are also noteworthy developments in the cryptocurrency space. Overall, the market continues to evolve with new trends and opportunities emerging regularly, making it essential for investors and enthusiasts to stay informed and navigate the digital asset space effectively."];
                            };
                            readonly TWITTER_SENTIMENT_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [12.11];
                            };
                            readonly TWITTER_SENTIMENT_LABEL: {
                                readonly type: "string";
                                readonly examples: readonly ["very negative"];
                            };
                            readonly TWITTER_SUMMARY: {
                                readonly type: "string";
                                readonly examples: readonly ["The cryptocurrency markets have been buzzing with activity, with a focus on the long-short ratio for CLV on dYdX and Gate.io. Gate.io has been noted to have a higher percentage of shorts, indicating a bearish sentiment among traders. However, the most discussed topic, apart from Bitcoin, has been the controversy surrounding the distribution of DOGE payments. Concerns have been raised about the exclusion of individuals such as SS recipients and the poor from receiving these payments, leading to a debate on the fairness of crypto distribution.\n\nAdditionally, there have been reports of scams and hacks in the cryptocurrency space, resulting in the loss of funds for some investors. Discussions have also emerged regarding hidden profits from crypto transactions and warnings issued by China regarding the risks associated with investing in cryptocurrencies.\n\nOverall, the sentiment in the cryptocurrency community appears to be a mix of excitement over Bitcoin's performance and concerns about the equitable distribution of cryptocurrencies. Investors and traders are advised to exercise caution and stay informed about the latest developments in the market."];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Tmai: {
    readonly body: {
        readonly type: "object";
        readonly required: readonly ["RAW_BODY"];
        readonly properties: {
            readonly RAW_BODY: {
                readonly type: "string";
                readonly description: "{     \"messages\":[         {             \"user\": \"What is the next 100x coin ?\"         }     ] }";
                readonly default: "{     \"messages\":[         {             \"user\": \"What is the next 100x coin ?\"         }     ] }";
                readonly format: "json";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["AI Chatbot response successful"];
                };
                readonly answer: {
                    readonly type: "string";
                    readonly examples: readonly ["Predicting the next 100x coin is speculative, but some projects show promise. Solaxy is enhancing Solana's scalability, Dawgz AI is leveraging AI for trading, and WEPE is combining meme culture with trading tools. These projects could potentially see significant growth if they execute well. Always do your own research and consider the risks!"];
                };
                readonly thread: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly user: {
                                readonly type: "string";
                                readonly examples: readonly ["What is the next 100x coin ?"];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TokenDetailsPriceCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly default: "3375";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Token ID for retrieving the charts. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs.";
                };
                readonly category: {
                    readonly type: "string";
                    readonly default: "trader";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type of market perspective, either trader or investor";
                };
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "MAX";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, YTD, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "price,trader_grade,bullish,bearish";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma-separated filters for Investor: price, investor_grade; Trader: price, trader_grade, bullish, bearish";
                };
            };
            readonly required: readonly ["token_id", "category", "timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/tokenDetailsPriceChart/tokenDetailsPriceCharts/chart_1708516191441.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Tokens: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Exmaple:3375,3306";
                };
                readonly token_name: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Crypto Asset Names (e.g., Bitcoin, Ethereum). Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token names.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly category: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories. Example: yield farming,defi";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges. Example: binance,gate";
                };
                readonly blockchain_address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Use this parameter to search tokens through specific blockchains and contract addresses. Input the blockchain name followed by a colon and then the contract address. Example: binance-smart-chain:0x57185189118c7e786cafd5c71f35b16012fa95ad. Click [here](https://api.tokenmetrics.com/api-docs/#/Blockchains/get_v2_blockchains) to access the list of blockchains.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [45273];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Doug"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["DOUG"];
                            };
                            readonly EXCHANGE_LIST: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly exchange_id: {
                                            readonly type: "string";
                                            readonly examples: readonly ["raydium2"];
                                        };
                                        readonly exchange_name: {
                                            readonly type: "string";
                                            readonly examples: readonly ["Raydium"];
                                        };
                                    };
                                };
                            };
                            readonly CATEGORY_LIST: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly category_id: {
                                            readonly type: "integer";
                                            readonly default: 0;
                                            readonly examples: readonly [25];
                                        };
                                        readonly category_name: {
                                            readonly type: "string";
                                            readonly examples: readonly ["Solana Ecosystem"];
                                        };
                                        readonly category_slug: {
                                            readonly type: "string";
                                            readonly examples: readonly ["solana-ecosystem"];
                                        };
                                    };
                                };
                            };
                            readonly TM_LINK: {
                                readonly type: "string";
                                readonly examples: readonly ["https://app.tokenmetrics.com/doug-2"];
                            };
                            readonly CONTRACT_ADDRESS: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly solana: {
                                        readonly type: "string";
                                        readonly examples: readonly ["AQiE2ghyFbBsbsfHiTEbKWcCLTDgyGzceKEPWftZpump"];
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TopMarketCapTokens: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly top_k: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Specifies the number of top cryptocurrencies to retrieve, based on their market capitalization. Exmaple: 100";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [50];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3375];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Bitcoin"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["BTC"];
                            };
                            readonly EXCHANGE_LIST: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly exchange_id: {
                                            readonly type: "string";
                                            readonly examples: readonly ["klever_exchange"];
                                        };
                                        readonly exchange_name: {
                                            readonly type: "string";
                                            readonly examples: readonly ["Bitcoin.me"];
                                        };
                                    };
                                };
                            };
                            readonly CATEGORY_LIST: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly category_id: {
                                            readonly type: "integer";
                                            readonly default: 0;
                                            readonly examples: readonly [63];
                                        };
                                        readonly category_name: {
                                            readonly type: "string";
                                            readonly examples: readonly ["Layer 1 (L1)"];
                                        };
                                        readonly category_slug: {
                                            readonly type: "string";
                                            readonly examples: readonly ["layer-1"];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TotalMarketCryptoCapCharts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly timeFrame: {
                    readonly type: "string";
                    readonly default: "MAX";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time duration for the market charts. Accepted values: 1W, 1M, 3M, Y, MAX";
                };
                readonly chartFilters: {
                    readonly type: "string";
                    readonly default: "total_market_cap,altcoin_market_cap,btc_market_cap";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "**Filters:** total_market_cap,altcoin_market_cap,btc_market_cap";
                };
            };
            readonly required: readonly ["timeFrame", "chartFilters"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly chartUrl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://tm-prtnr-plan.s3.amazonaws.com/data/internal/partnerplan/marketCharts/totalCryptoMarketCapCharts/chart_1708520873340.png"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TraderGrades: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Exmaple:3375,3306";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Example: 2023-10-01";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2023-10-10";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly category: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories. Example:layer-1,nft";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges. Example: binance,gate";
                };
                readonly marketcap: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum MarketCap in $. Example: 100";
                };
                readonly fdv: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum fully diluted valuation in $. Example: 100";
                };
                readonly volume: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum 24h trading volume in $. Example: 100";
                };
                readonly traderGrade: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum TM Trader Grade. Example: 17";
                };
                readonly traderGradePercentChange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum 24h percent change in TM Trader Grade. Example: 0.14";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [10];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3375];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Bitcoin"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["BTC"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-05-25T00:00:00.000Z"];
                            };
                            readonly TA_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [92.54];
                            };
                            readonly QUANT_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [62.99];
                            };
                            readonly TM_TRADER_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [86.63];
                            };
                            readonly TM_TRADER_GRADE_24H_PCT_CHANGE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.01];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TraderIndices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly default: "2023-10-01";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly default: "2023-10-10";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1000;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 0;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 0 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly api_key: {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["api_key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [72];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly PORTFOLIO_DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2022-07-01"];
                            };
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3960];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Iexec Rlc"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["RLC"];
                            };
                            readonly INDEX_WEIGHT: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [0.007379512118];
                            };
                            readonly INITIAL_PRICE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1.32];
                            };
                            readonly AMOUNT_OF_TOKENS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [55.905394836];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TradingSignals: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly token_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token IDs. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token IDs. Example: 3375,3306";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start Date accepts date as a string - YYYY-MM-DD format. Example: 2023-10-01";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End Date accepts date as a string - YYYY-MM-DD format. Example: 2023-10-10";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated Token Symbols. Click [here](https://api.tokenmetrics.com/api-docs/#/Coins/get_v2_coins) to access the list of token symbols. Example: BTC,ETH";
                };
                readonly category: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated category name. Click [here](https://api.tokenmetrics.com/api-docs/#/Categories/get_v2_categories) to access the list of categories. Example: layer-1,nft";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma Separated exchange name. Click [here](https://api.tokenmetrics.com/api-docs/#/Exchanges/get_v2_exchanges) to access the list of exchanges. Example: binance,gate";
                };
                readonly marketcap: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum MarketCap in $. Example: 100000000";
                };
                readonly volume: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum 24h trading volume in $. Example: 100000000";
                };
                readonly fdv: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum fully diluted valuation in $. Example: 100000000";
                };
                readonly signal: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The current signal value of the strategy, between bullish (1), bearish (-1) or no signal (0). Example: 1";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 50;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Limit the number of items in response";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Enables pagination and data retrieval control by skipping a specified number of items before fetching data. Page should be a non-negative integer, with 1 indicating the beginning of the dataset.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly default: "tm-********-****-****-****-************";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Data fetched successfully"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [5];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly TOKEN_ID: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [3306];
                            };
                            readonly TOKEN_NAME: {
                                readonly type: "string";
                                readonly examples: readonly ["Ethereum"];
                            };
                            readonly TOKEN_SYMBOL: {
                                readonly type: "string";
                                readonly examples: readonly ["ETH"];
                            };
                            readonly DATE: {
                                readonly type: "string";
                                readonly examples: readonly ["2025-03-03T00:00:00.000Z"];
                            };
                            readonly TRADING_SIGNAL: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [0];
                            };
                            readonly TOKEN_TREND: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [-1];
                            };
                            readonly TRADING_SIGNALS_RETURNS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1546.0255];
                            };
                            readonly HOLDING_RETURNS: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [1732.8483];
                            };
                            readonly tm_link: {
                                readonly type: "string";
                                readonly examples: readonly ["ethereum"];
                            };
                            readonly TM_TRADER_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [19.15];
                            };
                            readonly TM_INVESTOR_GRADE: {
                                readonly type: "number";
                                readonly default: 0;
                                readonly examples: readonly [63.35];
                            };
                            readonly TM_LINK: {
                                readonly type: "string";
                                readonly examples: readonly ["https://app.tokenmetrics.com/undefined"];
                            };
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Some thing wrong"];
                };
                readonly length: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly data: {
                    readonly type: "array";
                    readonly items: {};
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
export { AiReports, AllTrendIndicators, AnnualizedHistoricalVolatilityCharts, BitcoinVsAltcoinSeasonCharts, Correlation, CryptoInvestors, DailyOhlcv, HourlyOhlcv, IndexHoldings, IndexSpecificPerformance, IndicesIndexAllocationCharts, IndicesPerformance, IndicesRoiCharts, IndicesTransaction, InvestorGrades, InvestorIndices, MarketBullAndBearCharts, MarketMetrics, MarketMoversCharts, MarketPercentOfBullishTmGrades, MarketPercentOfBullishVsBearishCharts, MarketTmGradeSignal, Price, PricePrediction, Quantmetrics, ResistanceAndSupportCharts, ResistanceSupport, ScenarioAnalysis, SectorIndexTransaction, SectorIndicesHoldings, Sentiments, Tmai, TokenDetailsPriceCharts, Tokens, TopMarketCapTokens, TotalMarketCryptoCapCharts, TraderGrades, TraderIndices, TradingSignals };
