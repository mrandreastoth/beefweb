import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model'
import { Button, Dropdown } from './elements'
import { bindHandlers } from './utils'

function volumeIcon(isMuted)
{
    return isMuted ? 'volume-off' : 'volume-high';
}

class VolumeControlPanel extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { db, dbMin, isMuted } = this.props.playerModel.volume;

        return {
            volume: db,
            volumeMax: 0.0,
            volumeMin: dbMin,
            isMuted: isMuted,
        };
    }

    componentDidMount()
    {
        this.props.playerModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playerModel.off('change', this.handleUpdate);
    }

    handleMuteClick(e)
    {
        e.preventDefault();

        this.props.playerModel.mute();

        if (this.props.onAfterMuteClick)
            this.props.onAfterMuteClick();
    }

    handleVolumeChange(e)
    {
        e.preventDefault();
        const newVolume = Number(e.target.value);
        this.props.playerModel.setVolume(newVolume);
    }

    render()
    {
        const { isMuted, volume, volumeMin, volumeMax } = this.state;

        return (
            <div className='volume-control-panel'>
                <div className='button-bar'>
                    <Button
                        name={volumeIcon(isMuted)}
                        onClick={this.handleMuteClick}
                        title='Toggle mute' />
                </div>
                <input type='range'
                    className='volume-slider'
                    max={volumeMax}
                    min={volumeMin}
                    value={volume}
                    title={volume + 'dB'}
                    onChange={this.handleVolumeChange} />
            </div>
        );
    }
}

VolumeControlPanel.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    onAfterMuteClick: PropTypes.func,
};

export default class VolumeControl extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(this.getStateFromModel(), {
           panelOpen: false
        });

        this.handleUpdate = () => this.setState(this.getStateFromModel());

        bindHandlers(this);
    }

    getStateFromModel()
    {
        return {
            isMuted: this.props.playerModel.volume.isMuted
        };
    }

    componentDidMount()
    {
        this.props.playerModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playerModel.off('change', this.handleUpdate);
    }

    handlePanelToggle(value)
    {
        this.setState({ panelOpen: value });
    }

    handleMuteClick()
    {
        this.setState({ panelOpen: false });
    }

    render()
    {
        const { playerModel } = this.props;
        const { isMuted, panelOpen } = this.state;

        return (
            <div className='volume-control'>
                <div className='volume-control-mini'>
                    <div className='button-bar'>
                        <Dropdown
                            title='Show volume panel'
                            iconName={volumeIcon(isMuted)}
                            autoHide={false}
                            direction='center'
                            isOpen={panelOpen}
                            onRequestToggle={this.handlePanelToggle}>
                            <VolumeControlPanel
                                playerModel={playerModel}
                                onAfterMuteClick={this.handleMuteClick} />
                        </Dropdown>
                    </div>
                </div>
                <div className='volume-control-full'>
                    <VolumeControlPanel playerModel={playerModel} />
                </div>
            </div>
        );
    }
}

VolumeControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};