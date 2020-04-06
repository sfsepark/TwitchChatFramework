# TwitchChatFramework
트위치 채팅창 커스텀을 위한 브라우저 익스텐션 프레임워크

1.1.1 패치 이후로 크롬 이외에도 파이어폭스도 지원한다.|

# API DOCS 

https://www.notion.so/Twitch-Chat-Framework-daf475317ef644a580eeb5cfcbd78128

# TwitchChatFramework 의 구성요소 - content script
채팅창을 인식하고 채팅창의 DOM 오브젝트와 관련한 정보를 반환하는 tcf.chatTarget /

DOM 오브젝트 접근으로 처리하기 까다로운 채팅입력창의 value를 변조할 수 있는 tcf.chatText / tcf.chatCursor

이모티콘 선택기를 정의할 수 있는 tcf.picker

각 채팅창을 인식하여 특정 채팅창에서 TCF가 어떤역할을 해야하는지 정의할 수 있는 startChecker promise

TCF가 행동을 정의하는 tcf.config 가 있다.

# tcf config - TCF의 행동을 정의하는 설정

특정 생명주기에 실행시킬 함수, 이모티콘 선택기 정보, 채팅입력창에 입력된 채팅을 어떻게 분석할것인지 정의한 함수

등을 정의하여 tcf config 객체로 생성할 수 있다.

# startChecker 

'디시콘 익스텐션' 과 같이 특정 스트리머 방에서만 작동하거나 스트리머에 따라서 다른 역할을 해야하는 익스텐션이 있을 수 있다.

이 때 TCF의 행동(tcf config)를 동적으로 설정할 수 있는 함수가 바로 startChecker 이다.


startChecker 함수는 두 개의 파라미터를 받는다.

1. 어떤 스트리머의 채팅창인가? 

2. master 인가?

(* master 란?

TCF가 포함된 두개 이상의 프로젝트를 실행시키면 TCF의 메인로직은 한번만 실행시키고 tcf config에 정의된 행동만 각각 임베드 하기 위해서 
master - slave 구조로 프레임워크가 구성되어있다.)

startChecker 함수는 다음과 같은 출력을 한다.

- tcf config 를 resolve 하는 promise


startChecker 함수는 각 채팅창에서 어떤 행동을 하는지 정의할 수 있는 함수라고 정의할 수 있다.


# TwitchChatFramework 의 생명주기

tcf.start() 를 실행시켜서 트위치 위에서 실행한다.

각 채팅창을 인식하면 startChecker 를 전부 수행하여 TCF의 행동을 정의한다 (tcf.config)

새로운 기능을 임베드할 준비가 되면 tcf.config에 정의한 onLoad 생명주기가 실행되며

인식한 채팅창이 사라지면 해당 기능에 관련된 리셋작업을 돕는 tcf.config에 정의한 onReset 생명주기가 실행된다.



# 이모티콘 선택기

이모티콘 선택기는 (아이콘, contentFrame을 그리는 함수, controlFrame 을 그리는 함수, 각 생명주기에 어떤 행동을 할 것인지)

로 정의된다.




# 빌드 방법
make 파일로 컴파일 후 
TwitchChatFramework 디렉토리를 각 익스텐션의 루트 디렉토리 안에 복사한다

# 예시
트위치 디시콘 익스텐션 : https://github.com/sfsepark/twitch_dccon_extension
트위티콘 차원문 : https://github.com/sfsepark/twiticon_portal
